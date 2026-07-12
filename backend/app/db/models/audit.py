"""Audit models - audit cycle, assignments, and results."""

from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Enum as SQLEnum, ForeignKey, Index
from sqlalchemy.orm import relationship
import enum

from ..base import Base, TimestampMixin


class AuditCycleStatus(str, enum.Enum):
    """Audit cycle status enumeration."""
    OPEN = "Open"
    CLOSED = "Closed"


class AuditResultStatus(str, enum.Enum):
    """Audit result status enumeration."""
    VERIFIED = "Verified"
    MISSING = "Missing"
    DAMAGED = "Damaged"


class AuditCycle(Base, TimestampMixin):
    """
    Audit Cycle model representing a physical asset verification cycle.
    """
    __tablename__ = "audit_cycles"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Cycle details
    title = Column(String(255), nullable=False)
    
    # Scope filters (nullable - null means "all")
    scope_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    scope_location = Column(String(255), nullable=True)
    
    # Timeline
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Status
    status = Column(SQLEnum(AuditCycleStatus), nullable=False, default=AuditCycleStatus.OPEN, index=True)
    
    # Creator tracking
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    scope_department = relationship("Department", foreign_keys=[scope_department_id])
    assignments = relationship("AuditAssignment", back_populates="audit_cycle", cascade="all, delete-orphan")
    results = relationship("AuditResult", back_populates="audit_cycle", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<AuditCycle(id={self.id}, title={self.title}, status={self.status})>"


class AuditAssignment(Base, TimestampMixin):
    """
    Audit Assignment model linking auditors to audit cycles.
    """
    __tablename__ = "audit_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    
    audit_cycle_id = Column(Integer, ForeignKey("audit_cycles.id"), nullable=False, index=True)
    auditor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Relationships
    audit_cycle = relationship("AuditCycle", back_populates="assignments")
    auditor = relationship("User")
    
    # Composite index for efficient queries
    __table_args__ = (
        Index('idx_audit_assignment', 'audit_cycle_id', 'auditor_id'),
    )
    
    def __repr__(self):
        return f"<AuditAssignment(cycle_id={self.audit_cycle_id}, auditor_id={self.auditor_id})>"


class AuditResult(Base, TimestampMixin):
    """
    Audit Result model tracking verification results for each asset in a cycle.
    """
    __tablename__ = "audit_results"
    
    id = Column(Integer, primary_key=True, index=True)
    
    audit_cycle_id = Column(Integer, ForeignKey("audit_cycles.id"), nullable=False, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    
    # Expected vs actual
    expected_location = Column(String(255), nullable=True)
    
    # Result (null until marked by auditor)
    result = Column(SQLEnum(AuditResultStatus), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    
    # Marking tracking
    marked_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    marked_at = Column(DateTime, nullable=True)
    
    # Relationships
    audit_cycle = relationship("AuditCycle", back_populates="results")
    asset = relationship("Asset")
    marker = relationship("User", foreign_keys=[marked_by])
    
    # Composite index for efficient queries
    __table_args__ = (
        Index('idx_audit_result', 'audit_cycle_id', 'asset_id'),
    )
    
    def __repr__(self):
        return f"<AuditResult(cycle_id={self.audit_cycle_id}, asset_id={self.asset_id}, result={self.result})>"
