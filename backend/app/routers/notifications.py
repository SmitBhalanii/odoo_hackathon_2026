"""Notifications router - user notifications and activity log."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from ..core.deps import get_db, get_current_user
from ..db import models
from ..services.notification_service import NotificationService, ActivityLogService
from ..core.errors import NotFoundError

router = APIRouter(prefix="/notifications")


@router.get("")
def get_notifications(
    category: Optional[str] = Query(None, description="Filter by category: Alerts, Approvals, Bookings"),
    unread_only: bool = Query(False, description="Only return unread notifications"),
    limit: int = Query(50, ge=1, le=100, description="Maximum notifications to return"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get notifications for current user.
    
    Returns list of notifications with category field included for frontend filtering.
    
    Query Parameters:
    - **category**: Filter by category pill (Alerts, Approvals, Bookings)
    - **unread_only**: Only return unread notifications (default: false)
    - **limit**: Maximum number of notifications (default: 50, max: 100)
    
    Each notification includes:
    - id, type, title, message, read, created_at
    - resource_type, resource_id, action_url (optional)
    - **category**: Mapped from type for frontend pill filtering
    """
    notifications = NotificationService.get_notifications(
        db=db,
        user_id=current_user.id,
        category=category,
        unread_only=unread_only,
        limit=limit
    )
    
    # Add category to each notification
    results = []
    for notification in notifications:
        notification_dict = {
            "id": notification.id,
            "type": notification.type.value if hasattr(notification.type, 'value') else notification.type,
            "title": notification.title,
            "message": notification.message,
            "read": notification.read,
            "created_at": notification.created_at,
            "resource_type": notification.resource_type,
            "resource_id": notification.resource_id,
            "action_url": notification.action_url,
            "category": NotificationService.NOTIFICATION_CATEGORIES.get(
                notification.type.value if hasattr(notification.type, 'value') else notification.type,
                "Alerts"
            )
        }
        results.append(notification_dict)
    
    return results


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Mark a notification as read.
    
    Path Parameters:
    - **notification_id**: ID of the notification to mark as read
    
    Returns:
    - Updated notification
    """
    # Verify notification belongs to current user
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise NotFoundError(f"Notification with ID {notification_id} not found")
    
    notification = NotificationService.mark_as_read(db, notification_id)
    
    return {
        "id": notification.id,
        "read": notification.read,
        "message": "Notification marked as read"
    }


@router.patch("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Mark all notifications as read for current user.
    
    Returns:
    - Count of notifications marked as read
    """
    count = NotificationService.mark_all_as_read(db, current_user.id)
    
    return {
        "marked_read": count,
        "message": f"{count} notification(s) marked as read"
    }


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get count of unread notifications.
    
    Used for topbar bell badge display.
    
    Returns:
    - unread_count: Number of unread notifications
    """
    count = NotificationService.get_unread_count(db, current_user.id)
    
    return {
        "unread_count": count
    }


@router.get("/activity-log")
def get_activity_log(
    entity_type: Optional[str] = Query(None, description="Filter by entity type (e.g., Asset, Booking)"),
    entity_id: Optional[int] = Query(None, description="Filter by entity ID"),
    limit: int = Query(50, ge=1, le=200, description="Maximum activities to return"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get activity log entries.
    
    Returns recent activities with human-readable messages.
    
    Query Parameters:
    - **entity_type**: Optional - filter by entity type (Asset, Booking, Allocation, etc.)
    - **entity_id**: Optional - filter by specific entity ID
    - **limit**: Maximum activities to return (default: 50, max: 200)
    
    Each activity includes:
    - message: Human-readable description
    - timestamp: When the activity occurred
    - entity_type: Type of entity affected
    - entity_id: ID of entity affected
    - actor_name: Name of user who performed action (or "System")
    
    Use Cases:
    - Dashboard recent activity feed
    - Full audit trail view
    - Asset-specific activity history
    """
    # For Department Heads, scope to their department
    department_id = None
    if current_user.role == "Department Head" and current_user.department_id:
        department_id = current_user.department_id
    
    activities = ActivityLogService.get_recent_activity(
        db=db,
        limit=limit,
        entity_type=entity_type,
        entity_id=entity_id,
        department_id=department_id
    )
    
    return activities
