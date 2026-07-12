"""Reports service - analytics and reporting queries."""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional
import csv
from io import StringIO

from ..db import models


class ReportsService:
    """Service for reports and analytics."""
    
    @staticmethod
    def get_utilization_by_department(
        db: Session,
        department_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get asset utilization by department.
        
        Args:
            db: Database session
            department_id: Optional filter by specific department
            
        Returns:
            List of dicts with department, asset_count, allocated_count, utilization_pct
        """
        query = db.query(
            models.Department.id.label("department_id"),
            models.Department.name.label("department"),
            func.count(models.Asset.id).label("asset_count"),
            func.sum(
                case(
                    (models.Asset.status == "Allocated", 1),
                    else_=0
                )
            ).label("allocated_count")
        ).join(
            models.Asset, models.Asset.department_id == models.Department.id
        ).group_by(
            models.Department.id, models.Department.name
        )
        
        # Apply department filter
        if department_id:
            query = query.filter(models.Department.id == department_id)
        
        results = query.all()
        
        # Calculate utilization percentage
        output = []
        for row in results:
            asset_count = row.asset_count or 0
            allocated_count = row.allocated_count or 0
            utilization_pct = round(
                (allocated_count / asset_count * 100) if asset_count > 0 else 0,
                2
            )
            
            output.append({
                "department_id": row.department_id,
                "department": row.department,
                "asset_count": asset_count,
                "allocated_count": allocated_count,
                "utilization_pct": utilization_pct
            })
        
        return output
    
    @staticmethod
    def get_maintenance_frequency(
        db: Session,
        category_id: Optional[int] = None,
        period: str = "month",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """
        Get maintenance request frequency over time.
        
        Args:
            db: Database session
            category_id: Optional filter by asset category
            period: "week" or "month" for grouping
            start_date: Optional start date filter
            end_date: Optional end date filter
            
        Returns:
            List of dicts with period label and count
        """
        # Default date range to last 6 months
        if not end_date:
            end_date = datetime.utcnow().date()
        if not start_date:
            start_date = end_date - timedelta(days=180)
        
        # Build query based on period
        if period == "week":
            # Group by week (year-week format)
            time_group = func.strftime('%Y-W%W', models.MaintenanceRequest.created_at)
        else:  # month
            # Group by month (year-month format)
            time_group = func.strftime('%Y-%m', models.MaintenanceRequest.created_at)
        
        query = db.query(
            time_group.label("period"),
            func.count(models.MaintenanceRequest.id).label("count")
        )
        
        # Apply category filter
        if category_id:
            query = query.join(models.Asset).filter(
                models.Asset.category_id == category_id
            )
        
        # Apply date range
        query = query.filter(
            func.date(models.MaintenanceRequest.created_at).between(start_date, end_date)
        )
        
        # Group and order
        results = query.group_by(time_group).order_by(time_group).all()
        
        return [
            {"period": row.period, "count": row.count}
            for row in results
        ]
    
    @staticmethod
    def get_most_used_assets(
        db: Session,
        limit: int = 5,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get most frequently used assets based on allocations and bookings.
        
        Args:
            db: Database session
            limit: Number of top assets to return
            days: Number of days to look back
            
        Returns:
            List of dicts with asset_tag, asset_name, usage_count
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Count allocations per asset
        allocation_counts = db.query(
            models.Asset.id.label("asset_id"),
            func.count(models.Allocation.id).label("allocation_count")
        ).join(
            models.Allocation, models.Allocation.asset_id == models.Asset.id
        ).filter(
            models.Allocation.created_at >= cutoff_date
        ).group_by(models.Asset.id).subquery()
        
        # Count bookings per asset
        booking_counts = db.query(
            models.Asset.id.label("asset_id"),
            func.count(models.Booking.id).label("booking_count")
        ).join(
            models.Booking, models.Booking.asset_id == models.Asset.id
        ).filter(
            models.Booking.created_at >= cutoff_date
        ).group_by(models.Asset.id).subquery()
        
        # Combine counts
        query = db.query(
            models.Asset.id,
            models.Asset.tag,
            models.Asset.name,
            (
                func.coalesce(allocation_counts.c.allocation_count, 0) +
                func.coalesce(booking_counts.c.booking_count, 0)
            ).label("usage_count")
        ).outerjoin(
            allocation_counts, models.Asset.id == allocation_counts.c.asset_id
        ).outerjoin(
            booking_counts, models.Asset.id == booking_counts.c.asset_id
        ).filter(
            or_(
                allocation_counts.c.allocation_count > 0,
                booking_counts.c.booking_count > 0
            )
        ).order_by(
            func.desc("usage_count")
        ).limit(limit)
        
        results = query.all()
        
        return [
            {
                "asset_id": row.id,
                "asset_tag": row.tag,
                "asset_name": row.name,
                "usage_count": row.usage_count
            }
            for row in results
        ]
    
    @staticmethod
    def get_idle_assets(
        db: Session,
        days_threshold: int = 30,
        department_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get assets with no allocation or booking activity.
        
        Args:
            db: Database session
            days_threshold: Number of days with no activity
            department_id: Optional filter by department
            
        Returns:
            List of dicts with asset_tag, asset_name, days_idle
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_threshold)
        
        # Subquery: assets with recent allocations
        recent_allocations = db.query(
            models.Allocation.asset_id
        ).filter(
            models.Allocation.created_at >= cutoff_date
        ).distinct().subquery()
        
        # Subquery: assets with recent bookings
        recent_bookings = db.query(
            models.Booking.asset_id
        ).filter(
            models.Booking.created_at >= cutoff_date
        ).distinct().subquery()
        
        # Find assets NOT in either subquery
        query = db.query(
            models.Asset.id,
            models.Asset.tag,
            models.Asset.name,
            models.Asset.created_at
        ).filter(
            ~models.Asset.id.in_(recent_allocations),
            ~models.Asset.id.in_(recent_bookings)
        )
        
        # Apply department filter
        if department_id:
            query = query.filter(models.Asset.department_id == department_id)
        
        results = query.all()
        
        # Calculate days idle (since asset creation or cutoff, whichever is shorter)
        output = []
        for row in results:
            days_idle = (datetime.utcnow() - row.created_at).days
            if days_idle > days_threshold:
                days_idle = days_threshold  # Cap at threshold
            
            output.append({
                "asset_id": row.id,
                "asset_tag": row.tag,
                "asset_name": row.name,
                "days_idle": days_idle
            })
        
        return output
    
    @staticmethod
    def get_due_for_maintenance_or_retirement(
        db: Session,
        maintenance_interval_days: int = 180,
        retirement_age_years: int = 4,
        department_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get assets due for maintenance or nearing retirement.
        
        Args:
            db: Database session
            maintenance_interval_days: Days since last maintenance to flag
            retirement_age_years: Age in years to flag for retirement
            department_id: Optional filter by department
            
        Returns:
            List of dicts with asset_tag, asset_name, reason, detail
        """
        results = []
        cutoff_maintenance = datetime.utcnow() - timedelta(days=maintenance_interval_days)
        cutoff_retirement = datetime.utcnow() - timedelta(days=retirement_age_years * 365)
        
        # Query assets
        query = db.query(models.Asset)
        
        if department_id:
            query = query.filter(models.Asset.department_id == department_id)
        
        assets = query.all()
        
        for asset in assets:
            # Check for maintenance due
            last_maintenance = db.query(
                func.max(models.MaintenanceRequest.created_at)
            ).filter(
                models.MaintenanceRequest.asset_id == asset.id,
                models.MaintenanceRequest.status == "Resolved"
            ).scalar()
            
            if last_maintenance:
                days_since_maintenance = (datetime.utcnow() - last_maintenance).days
                if days_since_maintenance >= maintenance_interval_days:
                    results.append({
                        "asset_id": asset.id,
                        "asset_tag": asset.tag,
                        "asset_name": asset.name,
                        "reason": "maintenance_due",
                        "detail": f"Last maintenance: {days_since_maintenance} days ago"
                    })
            elif asset.created_at < cutoff_maintenance:
                # Never had maintenance and old enough
                days_since_creation = (datetime.utcnow() - asset.created_at).days
                results.append({
                    "asset_id": asset.id,
                    "asset_tag": asset.tag,
                    "asset_name": asset.name,
                    "reason": "maintenance_due",
                    "detail": f"No maintenance history ({days_since_creation} days old)"
                })
            
            # Check for retirement due (based on acquisition date)
            if asset.acquisition_date and asset.acquisition_date <= cutoff_retirement.date():
                years_old = (datetime.utcnow().date() - asset.acquisition_date).days / 365
                results.append({
                    "asset_id": asset.id,
                    "asset_tag": asset.tag,
                    "asset_name": asset.name,
                    "reason": "nearing_retirement",
                    "detail": f"Asset age: {years_old:.1f} years"
                })
        
        return results
    
    @staticmethod
    def get_booking_heatmap(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """
        Get booking heatmap data (day of week x hour).
        
        Args:
            db: Database session
            start_date: Optional start date
            end_date: Optional end date
            
        Returns:
            List of dicts with day_of_week, hour, count
        """
        # Default to last 90 days
        if not end_date:
            end_date = datetime.utcnow().date()
        if not start_date:
            start_date = end_date - timedelta(days=90)
        
        # Extract day of week (0=Sunday, 6=Saturday) and hour from start_time
        query = db.query(
            func.strftime('%w', models.Booking.start_time).label("day_of_week"),
            func.strftime('%H', models.Booking.start_time).label("hour"),
            func.count(models.Booking.id).label("count")
        ).filter(
            func.date(models.Booking.start_time).between(start_date, end_date)
        ).group_by(
            "day_of_week", "hour"
        ).order_by(
            "day_of_week", "hour"
        )
        
        results = query.all()
        
        # Convert day_of_week to day name
        day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        
        return [
            {
                "day_of_week": day_names[int(row.day_of_week)],
                "day_number": int(row.day_of_week),
                "hour": int(row.hour),
                "count": row.count
            }
            for row in results
        ]
    
    @staticmethod
    def export_report_to_csv(
        report_name: str,
        data: List[Dict[str, Any]]
    ) -> str:
        """
        Export report data to CSV format.
        
        Args:
            report_name: Name of the report
            data: List of dictionaries with report data
            
        Returns:
            CSV string
        """
        if not data:
            return ""
        
        # Create CSV in memory
        output = StringIO()
        
        # Get field names from first row
        fieldnames = list(data[0].keys())
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
        
        return output.getvalue()
