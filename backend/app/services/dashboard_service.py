"""Dashboard service - aggregated metrics and KPIs."""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta, date
from typing import Dict, Any, Optional

from ..db import models
from .notification_service import ActivityLogService


class DashboardService:
    """Service for dashboard metrics and aggregations."""
    
    @staticmethod
    def get_summary(
        db: Session,
        current_user: models.User
    ) -> Dict[str, Any]:
        """
        Get dashboard summary with KPIs and recent activity.
        
        For Department Heads, scopes metrics to their department automatically.
        
        Args:
            db: Database session
            current_user: Current logged-in user
            
        Returns:
            Dictionary with kpis, overdue_returns, and recent_activity
        """
        # Determine department scope
        department_id = None
        if current_user.role == "Department Head" and current_user.department_id:
            department_id = current_user.department_id
        
        # Get KPIs
        kpis = DashboardService._get_kpis(db, department_id)
        
        # Get overdue returns
        overdue_count = DashboardService._get_overdue_allocations_count(db, department_id)
        
        # Get recent activity
        recent_activity = ActivityLogService.get_recent_activity(
            db=db,
            limit=6,
            department_id=department_id
        )
        
        return {
            "kpis": kpis,
            "overdue_returns": overdue_count,
            "recent_activity": recent_activity
        }
    
    @staticmethod
    def _get_kpis(db: Session, department_id: Optional[int] = None) -> Dict[str, int]:
        """
        Get key performance indicators.
        
        Uses COUNT queries for performance (not loading full rows).
        
        Args:
            db: Database session
            department_id: Optional department filter
            
        Returns:
            Dictionary of KPI counts
        """
        # Base query for assets
        asset_query = db.query(models.Asset)
        if department_id:
            asset_query = asset_query.filter(models.Asset.department_id == department_id)
        
        # Asset counts by status
        assets_available = asset_query.filter(
            models.Asset.status == "Available"
        ).count()
        
        assets_allocated = asset_query.filter(
            models.Asset.status == "Allocated"
        ).count()
        
        # Maintenance requests today or in active statuses
        today = datetime.utcnow().date()
        maintenance_query = db.query(models.MaintenanceRequest)
        
        if department_id:
            # Filter by asset's department
            maintenance_query = maintenance_query.join(models.Asset).filter(
                models.Asset.department_id == department_id
            )
        
        maintenance_today = maintenance_query.filter(
            or_(
                func.date(models.MaintenanceRequest.created_at) == today,
                models.MaintenanceRequest.status.in_([
                    "Approved", "TechnicianAssigned", "InProgress"
                ])
            )
        ).count()
        
        # Active bookings (Upcoming or Ongoing)
        # Upcoming: start_time > now
        # Ongoing: start_time <= now < end_time
        now = datetime.utcnow()
        booking_query = db.query(models.Booking).filter(
            models.Booking.status.in_(["Confirmed", "Active", "Pending"])
        )
        
        if department_id:
            # Filter by asset's department
            booking_query = booking_query.join(models.Asset).filter(
                models.Asset.department_id == department_id
            )
        
        active_bookings = booking_query.filter(
            or_(
                models.Booking.start_time > now,  # Upcoming
                and_(
                    models.Booking.start_time <= now,
                    models.Booking.end_time >= now  # Ongoing
                )
            )
        ).count()
        
        # Pending transfers (is_transfer = 1, status = Requested/Pending)
        transfer_query = db.query(models.Allocation).filter(
            models.Allocation.is_transfer == 1,
            models.Allocation.transfer_status == "Pending"
        )
        
        if department_id:
            # Filter by asset's department
            transfer_query = transfer_query.join(models.Asset).filter(
                models.Asset.department_id == department_id
            )
        
        pending_transfers = transfer_query.count()
        
        # Upcoming returns (Active allocations with expected return in next 7 days)
        today_date = date.today()
        week_later = today_date + timedelta(days=7)
        
        returns_query = db.query(models.Allocation).filter(
            models.Allocation.status == "Active",
            models.Allocation.expected_return_date.between(today_date, week_later)
        )
        
        if department_id:
            # Filter by asset's department
            returns_query = returns_query.join(models.Asset).filter(
                models.Asset.department_id == department_id
            )
        
        upcoming_returns = returns_query.count()
        
        return {
            "assets_available": assets_available,
            "assets_allocated": assets_allocated,
            "maintenance_today": maintenance_today,
            "active_bookings": active_bookings,
            "pending_transfers": pending_transfers,
            "upcoming_returns": upcoming_returns
        }
    
    @staticmethod
    def _get_overdue_allocations_count(
        db: Session,
        department_id: Optional[int] = None
    ) -> int:
        """
        Get count of overdue allocations.
        
        Args:
            db: Database session
            department_id: Optional department filter
            
        Returns:
            Count of overdue allocations
        """
        today = date.today()
        
        query = db.query(models.Allocation).filter(
            models.Allocation.status == "Active",
            models.Allocation.expected_return_date < today
        )
        
        if department_id:
            # Filter by asset's department
            query = query.join(models.Asset).filter(
                models.Asset.department_id == department_id
            )
        
        return query.count()
