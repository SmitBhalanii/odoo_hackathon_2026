"""
Seed script to populate the database with demo data.
Run this after initializing the database to create sample records.

Usage:
    python seed.py
"""

import sys
from datetime import datetime, date, timedelta
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent))

from app.db.session import SessionLocal, init_db
from app.db import models
from app.core.security import get_password_hash


def seed_database():
    """Populate database with demo data."""
    
    print("Initializing database...")
    init_db()
    
    db = SessionLocal()
    
    try:
        print("\n🌱 Seeding database with demo data...")
        
        # Check if data already exists
        if db.query(models.User).first():
            print("⚠️  Database already contains data. Skipping seed.")
            return
        
        # 1. Create Organization
        print("\n📋 Creating organization...")
        org = models.Organization(
            name="TechCorp Solutions",
            address="123 Business Park, Tech City, TC 12345",
            contact_email="admin@techcorp.com",
            contact_phone="+1-555-0100"
        )
        db.add(org)
        db.flush()
        print(f"✓ Created organization: {org.name}")
        
        # 2. Create Departments
        print("\n🏢 Creating departments...")
        departments = [
            models.Department(name="IT", description="Information Technology", organization_id=org.id),
            models.Department(name="HR", description="Human Resources", organization_id=org.id),
            models.Department(name="Finance", description="Finance & Accounting", organization_id=org.id),
            models.Department(name="Operations", description="Operations & Logistics", organization_id=org.id),
        ]
        for dept in departments:
            db.add(dept)
        db.flush()
        print(f"✓ Created {len(departments)} departments")
        
        # 3. Create Locations
        print("\n📍 Creating locations...")
        locations = [
            models.Location(
                name="Main Office",
                address="123 Business Park, Tech City",
                building="Building A",
                floor="3rd Floor",
                organization_id=org.id
            ),
            models.Location(
                name="Asset Store",
                address="Storage Facility",
                building="Warehouse B",
                organization_id=org.id
            ),
            models.Location(
                name="Conference Center",
                address="123 Business Park",
                building="Building A",
                floor="2nd Floor",
                organization_id=org.id
            ),
        ]
        for loc in locations:
            db.add(loc)
        db.flush()
        print(f"✓ Created {len(locations)} locations")
        
        # 4. Create Users
        print("\n👥 Creating users...")
        users = [
            {
                "email": "admin@techcorp.com",
                "password": "admin123",
                "name": "Admin User",
                "role": "Admin",
                "department_id": departments[0].id
            },
            {
                "email": "manager@techcorp.com",
                "password": "manager123",
                "name": "Asset Manager",
                "role": "Asset Manager",
                "department_id": departments[0].id
            },
            {
                "email": "john.doe@techcorp.com",
                "password": "password123",
                "name": "John Doe",
                "role": "Employee",
                "department_id": departments[0].id
            },
            {
                "email": "jane.smith@techcorp.com",
                "password": "password123",
                "name": "Jane Smith",
                "role": "Department Head",
                "department_id": departments[1].id
            },
            {
                "email": "bob.wilson@techcorp.com",
                "password": "password123",
                "name": "Bob Wilson",
                "role": "Employee",
                "department_id": departments[3].id
            },
        ]
        
        user_objects = []
        for user_data in users:
            user = models.User(
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                name=user_data["name"],
                role=user_data["role"],
                status="Active",
                department_id=user_data["department_id"]
            )
            db.add(user)
            user_objects.append(user)
        
        db.flush()
        print(f"✓ Created {len(user_objects)} users")
        print("  📧 Login credentials:")
        for user_data in users:
            print(f"     {user_data['email']} / {user_data['password']}")
        
        # 5. Create Asset Categories
        print("\n📦 Creating asset categories...")
        categories = [
            {
                "name": "Laptops",
                "description": "Portable computers",
                "extra_fields": ["warranty_period", "processor_type", "ram_size"]
            },
            {
                "name": "Furniture",
                "description": "Office furniture and fixtures",
                "extra_fields": ["material", "dimensions", "color"]
            },
            {
                "name": "Electronics",
                "description": "Electronic devices and equipment",
                "extra_fields": ["model_number", "warranty_period"]
            },
            {
                "name": "Spaces",
                "description": "Bookable spaces and rooms",
                "extra_fields": ["capacity", "amenities"]
            },
        ]
        
        category_objects = []
        for cat_data in categories:
            category = models.AssetCategory(
                name=cat_data["name"],
                description=cat_data["description"],
                extra_fields=cat_data["extra_fields"],
                status="Active"
            )
            db.add(category)
            category_objects.append(category)
        
        db.flush()
        print(f"✓ Created {len(category_objects)} asset categories")
        
        # 6. Create Assets
        print("\n💼 Creating assets...")
        assets_data = [
            {
                "tag": "AF-0001",
                "name": "MacBook Pro 16\"",
                "description": "High-performance laptop for developers",
                "serial_number": "MBP2023-001",
                "category": category_objects[0],
                "status": "Allocated",
                "condition": "Good",
                "acquisition_date": date(2023, 1, 15),
                "acquisition_cost": 2499.99,
                "location": locations[0],
                "department": departments[0],
                "bookable": False,
                "extra_field_values": {
                    "warranty_period": "3 years",
                    "processor_type": "Apple M2 Pro",
                    "ram_size": "32GB"
                }
            },
            {
                "tag": "AF-0114",
                "name": "Dell Latitude 5420",
                "description": "Business laptop",
                "serial_number": "DL2023-114",
                "category": category_objects[0],
                "status": "Available",
                "condition": "Good",
                "acquisition_date": date(2023, 3, 20),
                "acquisition_cost": 1299.99,
                "location": locations[1],
                "department": departments[0],
                "bookable": False,
                "extra_field_values": {
                    "warranty_period": "2 years",
                    "processor_type": "Intel i7",
                    "ram_size": "16GB"
                }
            },
            {
                "tag": "AF-0042",
                "name": "Epson Projector",
                "description": "Conference room projector",
                "serial_number": "EP2022-042",
                "category": category_objects[2],
                "status": "Under Maintenance",
                "condition": "Fair",
                "acquisition_date": date(2022, 6, 10),
                "acquisition_cost": 799.99,
                "location": locations[2],
                "department": departments[3],
                "bookable": False,
                "extra_field_values": {
                    "model_number": "EP-7850",
                    "warranty_period": "1 year"
                }
            },
            {
                "tag": "AF-0089",
                "name": "Standing Desk",
                "description": "Ergonomic height-adjustable desk",
                "serial_number": "SD2023-089",
                "category": category_objects[1],
                "status": "Allocated",
                "condition": "Good",
                "acquisition_date": date(2023, 2, 5),
                "acquisition_cost": 599.99,
                "location": locations[0],
                "department": departments[3],
                "bookable": False,
                "extra_field_values": {
                    "material": "Wood & Steel",
                    "dimensions": "60x30 inches",
                    "color": "Walnut"
                }
            },
            {
                "tag": "AF-0203",
                "name": "Conference Room A",
                "description": "Large conference room with AV equipment",
                "category": category_objects[3],
                "status": "Available",
                "condition": "Good",
                "acquisition_date": date(2022, 1, 1),
                "acquisition_cost": 15000.00,
                "location": locations[2],
                "department": departments[1],
                "bookable": True,
                "extra_field_values": {
                    "capacity": "20 people",
                    "amenities": "Projector, Whiteboard, Video Conferencing"
                }
            },
        ]
        
        asset_objects = []
        for asset_data in assets_data:
            asset = models.Asset(
                tag=asset_data["tag"],
                name=asset_data["name"],
                description=asset_data.get("description"),
                serial_number=asset_data.get("serial_number"),
                category_id=asset_data["category"].id,
                status=asset_data["status"],
                condition=asset_data["condition"],
                acquisition_date=asset_data["acquisition_date"],
                acquisition_cost=asset_data["acquisition_cost"],
                location_id=asset_data["location"].id,
                department_id=asset_data["department"].id,
                bookable=asset_data["bookable"],
                extra_field_values=asset_data.get("extra_field_values", {})
            )
            db.add(asset)
            asset_objects.append(asset)
        
        db.flush()
        print(f"✓ Created {len(asset_objects)} assets")
        
        # 7. Create Allocations
        print("\n🔄 Creating allocations...")
        allocations = [
            {
                "asset": asset_objects[0],  # MacBook Pro
                "user": user_objects[2],    # John Doe
                "allocated_date": date.today() - timedelta(days=30),
                "expected_return_date": date.today() + timedelta(days=335),
                "status": "Active",
                "allocation_notes": "For software development work"
            },
            {
                "asset": asset_objects[3],  # Standing Desk
                "user": user_objects[4],    # Bob Wilson
                "allocated_date": date.today() - timedelta(days=60),
                "status": "Active",
                "allocation_notes": "Permanent desk assignment"
            },
        ]
        
        for alloc_data in allocations:
            allocation = models.Allocation(
                asset_id=alloc_data["asset"].id,
                user_id=alloc_data["user"].id,
                allocated_date=alloc_data["allocated_date"],
                expected_return_date=alloc_data.get("expected_return_date"),
                status=alloc_data["status"],
                allocation_notes=alloc_data.get("allocation_notes"),
                allocated_by_id=user_objects[1].id  # Asset Manager
            )
            db.add(allocation)
        
        db.flush()
        print(f"✓ Created {len(allocations)} allocations")
        
        # 8. Create Bookings
        print("\n📅 Creating bookings...")
        bookings = [
            {
                "asset": asset_objects[4],  # Conference Room A
                "user": user_objects[3],    # Jane Smith
                "start_time": datetime.now() + timedelta(days=2, hours=10),
                "end_time": datetime.now() + timedelta(days=2, hours=12),
                "purpose": "Team Meeting",
                "status": "Confirmed"
            },
        ]
        
        for book_data in bookings:
            booking = models.Booking(
                asset_id=book_data["asset"].id,
                user_id=book_data["user"].id,
                start_time=book_data["start_time"],
                end_time=book_data["end_time"],
                purpose=book_data["purpose"],
                status=book_data["status"],
                approved_by_id=user_objects[1].id
            )
            db.add(booking)
        
        db.flush()
        print(f"✓ Created {len(bookings)} bookings")
        
        # 9. Create Maintenance Requests
        print("\n🔧 Creating maintenance requests...")
        maintenance_requests = [
            {
                "asset": asset_objects[2],  # Epson Projector
                "requester": user_objects[3],
                "issue_description": "Projector lamp needs replacement, image is dim",
                "priority": "High",
                "status": "In Progress",
                "scheduled_date": date.today() + timedelta(days=3)
            },
        ]
        
        for maint_data in maintenance_requests:
            maintenance = models.MaintenanceRequest(
                asset_id=maint_data["asset"].id,
                requester_id=maint_data["requester"].id,
                issue_description=maint_data["issue_description"],
                priority=maint_data["priority"],
                status=maint_data["status"],
                scheduled_date=maint_data.get("scheduled_date"),
                approved_by_id=user_objects[1].id
            )
            db.add(maintenance)
        
        db.flush()
        print(f"✓ Created {len(maintenance_requests)} maintenance requests")
        
        # 10. Create Activity Log
        print("\n📊 Creating activity log entries...")
        activities = [
            {
                "user": user_objects[1],
                "action": "allocated",
                "description": f"Laptop {asset_objects[0].tag} assigned to {user_objects[2].name}"
            },
            {
                "user": user_objects[3],
                "action": "booking",
                "description": f"Booked {asset_objects[4].name} for team meeting"
            },
            {
                "user": user_objects[3],
                "action": "maintenance",
                "description": f"Raised maintenance request for {asset_objects[2].name}"
            },
        ]
        
        for activity_data in activities:
            activity = models.Activity(
                user_id=activity_data["user"].id,
                action=activity_data["action"],
                description=activity_data["description"]
            )
            db.add(activity)
        
        db.flush()
        print(f"✓ Created {len(activities)} activity log entries")
        
        # Commit all changes
        db.commit()
        
        print("\n✅ Database seeded successfully!")
        print("\n" + "="*60)
        print("DEMO LOGIN CREDENTIALS")
        print("="*60)
        print("\n🔑 Admin Account:")
        print("   Email: admin@techcorp.com")
        print("   Password: admin123")
        print("\n🔑 Manager Account:")
        print("   Email: manager@techcorp.com")
        print("   Password: manager123")
        print("\n🔑 Employee Account:")
        print("   Email: john.doe@techcorp.com")
        print("   Password: password123")
        print("\n" + "="*60)
        
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
