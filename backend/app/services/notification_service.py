"""Notification service - handles user notifications."""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional

from ..db import models
from ..core.errors import NotFoundError


class NotificationService:
    """Service for notification operations."""
    
    # Category mapping for frontend pill filters
    NOTIFICATION_CATEGORIES = {
        "asset_assigned": "Alerts",
        "asset_returned": "Alerts",
        "transfer_pending": "Approvals",
        "transfer_approved": "Alerts",
        "booking_confirmed": "Bookings",
        "booking_reminder": "Bookings",
        "maintenance_approved": "Approvals",
        "maintenance_completed": "Alerts",
        "return_reminder": "Alerts",
        "overdue_alert": "Alerts",
        "audit_discrepancy": "Alerts",
        "system_alert": "Alerts"
    }
    
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        type: str,
        message: str,
        title: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        action_url: Optional[str] = None
    ) -> models.Notification:
        """
        Create a new notification for a user.
        
        Args:
            db: Database session
            user_id: User ID to notify
            type: Notification type (enum value)
            message: Notification message
            title: Optional title (auto-generated if not provided)
            resource_type: Optional resource type
            resource_id: Optional resource ID
            action_url: Optional action URL
            
        Returns:
            Created notification
        """
        # Auto-generate title if not provided
        if not title:
            title = NotificationService._generate_title(type)
        
        notification = models.Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            resource_type=resource_type,
            resource_id=resource_id,
            action_url=action_url,
            read=False
        )
        
        db.add(notification)
        db.flush()  # Get notification.id without full commit
        
        print(f"\n📬 NOTIFICATION CREATED")
        print(f"User: {user_id}, Type: {type}")
        print(f"Message: {message}")
        
        return notification
    
    @staticmethod
    def _generate_title(notification_type: str) -> str:
        """Generate title from notification type."""
        titles = {
            "asset_assigned": "Asset Assigned",
            "asset_returned": "Asset Returned",
            "transfer_pending": "Transfer Pending",
            "transfer_approved": "Transfer Approved",
            "booking_confirmed": "Booking Confirmed",
            "booking_reminder": "Booking Reminder",
            "maintenance_approved": "Maintenance Approved",
            "maintenance_completed": "Maintenance Completed",
            "return_reminder": "Return Reminder",
            "overdue_alert": "Overdue Alert",
            "audit_discrepancy": "Audit Discrepancy",
            "system_alert": "System Alert"
        }
        return titles.get(notification_type, "Notification")
    
    @staticmethod
    def mark_as_read(db: Session, notification_id: int) -> models.Notification:
        """Mark notification as read."""
        notification = db.query(models.Notification).filter(
            models.Notification.id == notification_id
        ).first()
        
        if not notification:
            raise NotFoundError(f"Notification with ID {notification_id} not found")
        
        notification.read = True
        db.commit()
        db.refresh(notification)
        
        return notification
    
    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        """Mark all notifications as read for a user."""
        count = db.query(models.Notification).filter(
            models.Notification.user_id == user_id,
            models.Notification.read == False
        ).update({"read": True})
        
        db.commit()
        return count
    
    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """Get count of unread notifications for a user."""
        return db.query(models.Notification).filter(
            models.Notification.user_id == user_id,
            models.Notification.read == False
        ).count()
    
    @staticmethod
    def get_notifications(
        db: Session,
        user_id: int,
        category: Optional[str] = None,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[models.Notification]:
        """
        Get notifications for a user with optional filters.
        
        Args:
            db: Database session
            user_id: User ID
            category: Optional category filter (Alerts/Approvals/Bookings)
            unread_only: Only return unread notifications
            limit: Maximum number of notifications
            
        Returns:
            List of notifications
        """
        query = db.query(models.Notification).filter(
            models.Notification.user_id == user_id
        )
        
        # Filter by category
        if category:
            # Get notification types for this category
            types = [
                t for t, c in NotificationService.NOTIFICATION_CATEGORIES.items()
                if c == category
            ]
            if types:
                query = query.filter(models.Notification.type.in_(types))
        
        # Filter by read status
        if unread_only:
            query = query.filter(models.Notification.read == False)
        
        # Order by newest first
        notifications = query.order_by(
            models.Notification.created_at.desc()
        ).limit(limit).all()
        
        return notifications
    
    @staticmethod
    def check_overdue_allocations(db: Session):
        """
        Scheduled check for overdue allocations.
        Creates notifications for allocations past expected return date.
        """
        today = datetime.utcnow().date()
        
        # Find active allocations past expected return date
        overdue_allocations = db.query(models.Allocation).filter(
            models.Allocation.status == "Active",
            models.Allocation.expected_return_date < today
        ).all()
        
        for allocation in overdue_allocations:
            # Check if we already sent notification today
            existing = db.query(models.Notification).filter(
                models.Notification.user_id == allocation.user_id,
                models.Notification.type == "overdue_alert",
                models.Notification.resource_type == "allocation",
                models.Notification.resource_id == allocation.id,
                models.Notification.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
            ).first()
            
            if not existing:
                # Create overdue notification
                days_overdue = (today - allocation.expected_return_date).days
                message = (
                    f"Your allocation of {allocation.asset.tag} ({allocation.asset.name}) "
                    f"is {days_overdue} day(s) overdue. Please return it as soon as possible."
                )
                
                NotificationService.create_notification(
                    db=db,
                    user_id=allocation.user_id,
                    type="overdue_alert",
                    message=message,
                    resource_type="allocation",
                    resource_id=allocation.id
                )
        
        db.commit()
        return len(overdue_allocations)
    
    @staticmethod
    def check_booking_reminders(db: Session):
        """
        Scheduled check for upcoming bookings.
        Creates reminders for bookings starting within the next hour.
        """
        now = datetime.utcnow()
        one_hour_later = now + timedelta(hours=1)
        
        # Find bookings starting soon
        upcoming_bookings = db.query(models.Booking).filter(
            models.Booking.status.in_(["Confirmed", "Pending"]),
            models.Booking.start_time >= now,
            models.Booking.start_time <= one_hour_later
        ).all()
        
        for booking in upcoming_bookings:
            # Check if we already sent reminder
            existing = db.query(models.Notification).filter(
                models.Notification.user_id == booking.user_id,
                models.Notification.type == "booking_reminder",
                models.Notification.resource_type == "booking",
                models.Notification.resource_id == booking.id
            ).first()
            
            if not existing:
                # Create booking reminder
                minutes_until = int((booking.start_time - now).total_seconds() / 60)
                message = (
                    f"Your booking for {booking.asset.tag} ({booking.asset.name}) "
                    f"starts in {minutes_until} minutes."
                )
                
                NotificationService.create_notification(
                    db=db,
                    user_id=booking.user_id,
                    type="booking_reminder",
                    message=message,
                    resource_type="booking",
                    resource_id=booking.id
                )
        
        db.commit()
        return len(upcoming_bookings)


class ActivityLogService:
    """Service for activity logging."""
    
    @staticmethod
    def log_activity(
        db: Session,
        actor: Optional[models.User],
        action: str,
        entity_type: str,
        entity_id: int,
        detail: str
    ) -> models.Activity:
        """
        Log an activity/action in the system.
        
        Args:
            db: Database session
            actor: User who performed the action (None for system actions)
            action: Action type (e.g., "status_change", "created", "approved")
            entity_type: Type of entity (e.g., "Asset", "Booking")
            entity_id: ID of the entity
            detail: Human-readable detail message
            
        Returns:
            Created activity log entry
        """
        activity = models.Activity(
            user_id=actor.id if actor else None,
            action=action,
            resource_type=entity_type,
            resource_id=entity_id,
            description=detail
        )
        
        db.add(activity)
        db.flush()
        
        print(f"\n📝 ACTIVITY LOGGED: {detail}")
        
        return activity
    
    @staticmethod
    def format_activity_message(activity: models.Activity) -> str:
        """
        Format activity log into human-readable message.
        
        Args:
            activity: Activity log entry
            
        Returns:
            Formatted message string
        """
        # Use existing description if well-formatted
        if activity.description:
            return activity.description
        
        # Otherwise build from fields (fallback)
        actor_name = activity.user.name if activity.user else "System"
        return f"{actor_name} performed {activity.action} on {activity.resource_type} #{activity.resource_id}"
    
    @staticmethod
    def get_recent_activity(
        db: Session,
        limit: int = 6,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        department_id: Optional[int] = None
    ) -> List[dict]:
        """
        Get recent activity logs.
        
        Args:
            db: Database session
            limit: Number of recent activities to return
            entity_type: Optional filter by entity type
            entity_id: Optional filter by entity ID
            department_id: Optional filter by user's department
            
        Returns:
            List of formatted activity dictionaries
        """
        query = db.query(models.Activity)
        
        # Apply filters
        if entity_type:
            query = query.filter(models.Activity.resource_type == entity_type)
        
        if entity_id:
            query = query.filter(models.Activity.resource_id == entity_id)
        
        if department_id:
            # Filter activities by users in the department
            query = query.join(models.User).filter(
                models.User.department_id == department_id
            )
        
        # Get recent activities
        activities = query.order_by(
            models.Activity.created_at.desc()
        ).limit(limit).all()
        
        # Format activities
        results = []
        for activity in activities:
            results.append({
                "message": ActivityLogService.format_activity_message(activity),
                "timestamp": activity.created_at,
                "entity_type": activity.resource_type,
                "entity_id": activity.resource_id,
                "actor_name": activity.user.name if activity.user else "System"
            })
        
        return results
