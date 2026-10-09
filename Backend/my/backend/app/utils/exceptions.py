from fastapi import HTTPException, status

class KaamConnectException(HTTPException):
    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(
            status_code=status_code,
            detail={"code": code, "message": message}
        )

class WorkerNotAvailable(KaamConnectException):
    def __init__(self, message: str = "Worker is currently not available."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="WORKER_NOT_AVAILABLE",
            message=message
        )

class OfferExpired(KaamConnectException):
    def __init__(self, message: str = "Job offer has expired."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="OFFER_EXPIRED",
            message=message
        )

class OfferAlreadyAccepted(KaamConnectException):
    def __init__(self, message: str = "Job offer has already been accepted."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="OFFER_ALREADY_ACCEPTED",
            message=message
        )

class OfferAlreadyProcessed(KaamConnectException):
    def __init__(self, message: str = "Job offer has already been processed."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="OFFER_ALREADY_PROCESSED",
            message=message
        )

class UnauthorizedResource(KaamConnectException):
    def __init__(self, message: str = "You do not have permission to access or modify this resource."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="UNAUTHORIZED_RESOURCE",
            message=message
        )

class ResourceNotFound(KaamConnectException):
    def __init__(self, message: str = "Requested resource was not found."):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=message
        )

class InvalidSkillForTrade(KaamConnectException):
    def __init__(self, message: str = "The selected skill does not belong to the selected trade."):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="INVALID_SKILL_FOR_TRADE",
            message=message
        )

class InvalidWorkOrderVersion(KaamConnectException):
    def __init__(self, message: str = "Invalid work order version modification."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_WORK_ORDER_VERSION",
            message=message
        )

class AssignmentConflict(KaamConnectException):
    def __init__(self, message: str = "Worker has an overlapping conflicting assignment."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="ASSIGNMENT_CONFLICT",
            message=message
        )

class AttendanceAlreadyCheckedIn(KaamConnectException):
    def __init__(self, message: str = "Worker has already checked in for this date."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="ATTENDANCE_ALREADY_CHECKED_IN",
            message=message
        )

class AttendanceAlreadyConfirmed(KaamConnectException):
    def __init__(self, message: str = "Attendance has already been confirmed."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="ATTENDANCE_ALREADY_CONFIRMED",
            message=message
        )

class PaymentAlreadyDisputed(KaamConnectException):
    def __init__(self, message: str = "Payment is already under dispute."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="PAYMENT_ALREADY_DISPUTED",
            message=message
        )

class DisputeAlreadyResolved(KaamConnectException):
    def __init__(self, message: str = "Dispute has already been resolved or closed."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="DISPUTE_ALREADY_RESOLVED",
            message=message
        )
