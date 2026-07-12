"""Reports router - analytics and reporting endpoints."""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from io import StringIO

from ..core.deps import get_db, get_current_user
from ..db import models
from ..services.reports_service import ReportsService

router = APIRouter(prefix="/reports")


@router.get("/utilization-by-department")
def get_utilization_by_department(
    department_id: Optional[int] = Query(None, description="Filter by specific department"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get asset utilization by department.
    
    Returns list of departments with:
    - **department**: Department name
    - **asset_count**: Total assets in department
    - **allocated_count**: Number of allocated assets
    - **utilization_pct**: Utilization percentage (allocated/total * 100)
    
    Query Parameters:
    - **department_id**: Optional - filter by specific department
    """
    results = ReportsService.get_utilization_by_department(
        db=db,
        department_id=department_id
    )
    
    return results


@router.get("/maintenance-frequency")
def get_maintenance_frequency(
    period: str = Query("month", description="Grouping period: 'week' or 'month'"),
    category_id: Optional[int] = Query(None, description="Filter by asset category"),
    start_date: Optional[date] = Query(None, description="Start date for range"),
    end_date: Optional[date] = Query(None, description="End date for range"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get maintenance request frequency over time.
    
    Returns list with:
    - **period**: Time period label (e.g., "2026-01" or "2026-W03")
    - **count**: Number of maintenance requests in period
    
    Query Parameters:
    - **period**: "week" or "month" for grouping (default: month)
    - **category_id**: Optional - filter by asset category
    - **start_date**: Optional - start of date range (default: 6 months ago)
    - **end_date**: Optional - end of date range (default: today)
    """
    results = ReportsService.get_maintenance_frequency(
        db=db,
        category_id=category_id,
        period=period,
        start_date=start_date,
        end_date=end_date
    )
    
    return results


@router.get("/most-used-assets")
def get_most_used_assets(
    limit: int = Query(5, ge=1, le=50, description="Number of top assets to return"),
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get most frequently used assets.
    
    Usage is calculated by combining allocation and booking events in the specified time window.
    
    Returns list with:
    - **asset_tag**: Asset tag
    - **asset_name**: Asset name
    - **usage_count**: Combined count of allocations + bookings
    
    Query Parameters:
    - **limit**: Number of top assets to return (default: 5, max: 50)
    - **days**: Number of days to look back (default: 30)
    """
    results = ReportsService.get_most_used_assets(
        db=db,
        limit=limit,
        days=days
    )
    
    return results


@router.get("/idle-assets")
def get_idle_assets(
    days_threshold: int = Query(30, ge=1, description="Days with no activity"),
    department_id: Optional[int] = Query(None, description="Filter by department"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get assets with no allocation or booking activity.
    
    Returns list with:
    - **asset_tag**: Asset tag
    - **asset_name**: Asset name
    - **days_idle**: Number of days with no activity
    
    Query Parameters:
    - **days_threshold**: Minimum days with no activity (default: 30)
    - **department_id**: Optional - filter by department
    """
    results = ReportsService.get_idle_assets(
        db=db,
        days_threshold=days_threshold,
        department_id=department_id
    )
    
    return results


@router.get("/due-for-maintenance-or-retirement")
def get_due_for_maintenance_or_retirement(
    maintenance_interval_days: int = Query(
        180, 
        ge=1, 
        description="Days since last maintenance to flag"
    ),
    retirement_age_years: int = Query(
        4, 
        ge=1, 
        description="Age in years to flag for retirement"
    ),
    department_id: Optional[int] = Query(None, description="Filter by department"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get assets due for maintenance or nearing retirement.
    
    Returns list with:
    - **asset_tag**: Asset tag
    - **asset_name**: Asset name
    - **reason**: "maintenance_due" or "nearing_retirement"
    - **detail**: Specific detail (e.g., "Last maintenance: 200 days ago")
    
    Query Parameters:
    - **maintenance_interval_days**: Days threshold for maintenance (default: 180)
    - **retirement_age_years**: Age threshold for retirement (default: 4)
    - **department_id**: Optional - filter by department
    """
    results = ReportsService.get_due_for_maintenance_or_retirement(
        db=db,
        maintenance_interval_days=maintenance_interval_days,
        retirement_age_years=retirement_age_years,
        department_id=department_id
    )
    
    return results


@router.get("/booking-heatmap")
def get_booking_heatmap(
    start_date: Optional[date] = Query(None, description="Start date for range"),
    end_date: Optional[date] = Query(None, description="End date for range"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get booking heatmap data (day of week x hour).
    
    Returns list with:
    - **day_of_week**: Day name (e.g., "Monday")
    - **day_number**: Day number (0=Sunday, 6=Saturday)
    - **hour**: Hour (0-23)
    - **count**: Number of bookings
    
    Useful for visualizing booking patterns across the week.
    
    Query Parameters:
    - **start_date**: Optional - start of date range (default: 90 days ago)
    - **end_date**: Optional - end of date range (default: today)
    """
    results = ReportsService.get_booking_heatmap(
        db=db,
        start_date=start_date,
        end_date=end_date
    )
    
    return results


@router.get("/export")
def export_report(
    type: str = Query(..., description="Report type to export"),
    format: str = Query("csv", description="Export format (only 'csv' supported)"),
    # Common filters
    department_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    # Report-specific params
    limit: int = Query(5),
    days: int = Query(30),
    days_threshold: int = Query(30),
    period: str = Query("month"),
    maintenance_interval_days: int = Query(180),
    retirement_age_years: int = Query(4),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Export any report as CSV.
    
    Supports all report types:
    - utilization-by-department
    - maintenance-frequency
    - most-used-assets
    - idle-assets
    - due-for-maintenance-or-retirement
    - booking-heatmap
    
    Query Parameters:
    - **type**: Report type (required)
    - **format**: Export format (default: csv, only csv supported currently)
    - Additional filters matching the specific report endpoint
    
    Returns:
    - CSV file as streaming response
    """
    # Get report data based on type
    if type == "utilization-by-department":
        data = ReportsService.get_utilization_by_department(db, department_id)
    elif type == "maintenance-frequency":
        data = ReportsService.get_maintenance_frequency(
            db, category_id, period, start_date, end_date
        )
    elif type == "most-used-assets":
        data = ReportsService.get_most_used_assets(db, limit, days)
    elif type == "idle-assets":
        data = ReportsService.get_idle_assets(db, days_threshold, department_id)
    elif type == "due-for-maintenance-or-retirement":
        data = ReportsService.get_due_for_maintenance_or_retirement(
            db, maintenance_interval_days, retirement_age_years, department_id
        )
    elif type == "booking-heatmap":
        data = ReportsService.get_booking_heatmap(db, start_date, end_date)
    else:
        return {"error": f"Unknown report type: {type}"}
    
    # Export to CSV
    csv_content = ReportsService.export_report_to_csv(type, data)
    
    # Return as streaming response
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={type}.csv"
        }
    )
