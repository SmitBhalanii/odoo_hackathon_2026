# PowerShell script to update remaining fetch calls in frontend pages

$pages = @(
    @{
        file = "src\pages\Audit.jsx"
        imports = "import { getAuditCycles, createAuditCycle, getAuditAssets, verifyAsset, addAuditNote, closeAuditCycle } from '../api/audit';`nimport { getDepartments } from '../api/departments';`nimport { getEmployees } from '../api/employees';`nimport { transitionStatus } from '../api/assets';"
    },
    @{
        file = "src\pages\Notifications.jsx"
        imports = "import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../api/notifications';"
    },
    @{
        file = "src\pages\OrgSetup.jsx"
        imports = "import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../api/departments';`nimport { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';`nimport { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../api/employees';"
    },
    @{
        file = "src\pages\Reports.jsx"
        imports = "import { getUtilizationByDepartment, getMaintenanceFrequency, getMostUsedAssets, getIdleAssets, getUpcomingMaintenanceRetirement, getDepartmentAllocationSummary, exportReport } from '../api/reports';"
    }
)

Write-Host "Files to update:" -ForegroundColor Yellow
foreach ($page in $pages) {
    Write-Host "  - $($page.file)" -ForegroundColor Cyan
}

Write-Host "`nNote: Manual updates required for complex fetch calls" -ForegroundColor Green
Write-Host "Run: npm run build to verify after updates" -ForegroundColor Green
