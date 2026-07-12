"""Dashboard router - aggregated metrics and KPIs."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.deps import get_db, get_current_user
from ..db import models
from ..services.dashboard_service import DashboardService
from ..services.notification_service import NotificationService

router = APIRouter(prefix="/dashboard")


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get dashboard summary with KPIs and recent activity.
    
    Returns aggregated metrics optimized for dashboard display:
    - **kpis**: Key performance indicators
      - assets_available: Count of available assets
      - assets_allocated: Count of allocated assets
      - maintenance_today: Count of maintenance requests today or in active status
      - active_bookings: Count of upcoming or ongoing bookings
      - pending_transfers: Count of pending transfer requests
      - upcoming_returns: Count of allocations due for return in next 7 days
    - **overdue_returns**: Count of overdue allocations
    - **recent_activity**: Last 6 activity log entries with formatted messages
    
    **Department Scoping**:
    - For Department Heads, metrics are automatically scoped to their department
    - For Admins and Asset Managers, metrics show organization-wide data
    
    **Performance**:
    - Uses COUNT queries for fast aggregation
    - Does not load full model instances into Python
    """
    # Run scheduled checks for notifications
    # (In production, this would be a separate scheduled task)
    NotificationService.check_overdue_allocations(db)
    NotificationService.check_booking_reminders(db)
    
    # Get dashboard summary
    summary = DashboardService.get_summary(db, current_user)
    
    return summary
