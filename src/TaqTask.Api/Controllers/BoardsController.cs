using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using System.Security.Claims;
using TaqTask.Application.Services;

namespace TaqTask.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BoardsController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly ISubscriptionService _subscriptionService;

        public BoardsController(IConfiguration configuration, ISubscriptionService subscriptionService)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ?? 
                "Server=localhost;Database=ToDoOS;Integrated Security=true;TrustServerCertificate=true;";
            _subscriptionService = subscriptionService;
        }

        private int? GetTenantId()
        {
            var tenantIdClaim = User.FindFirst("TenantId")?.Value;
            if (int.TryParse(tenantIdClaim, out var tenantId))
                return tenantId;
            return null;
        }

        [HttpGet]
        public async Task<IActionResult> GetBoards()
        {
            try
            {
                var tenantId = GetTenantId();
                if (tenantId == null)
                    return Unauthorized(new { message = "Tenant context required" });

                using var connection = new SqlConnection(_connectionString);

                var boardsSql = @"
                    SELECT b.*, u.full_name as OwnerName
                    FROM boards b
                    LEFT JOIN users u ON b.owner_id = u.id
                    WHERE b.tenant_id = @TenantId
                    ORDER BY b.is_archived ASC, b.created_at DESC";

                var boards = await connection.QueryAsync(boardsSql, new { TenantId = tenantId });

                var result = new List<object>();

                foreach (var board in boards)
                {
                    var columnsSql = @"
                        SELECT * FROM board_columns 
                        WHERE board_id = @BoardId AND tenant_id = @TenantId
                        ORDER BY position";

                    var columns = await connection.QueryAsync(columnsSql, new { BoardId = board.id, TenantId = tenantId });

                    var boardColumns = new List<object>();

                    foreach (var column in columns)
                    {
                        var cardsSql = @"
                            SELECT c.*, u.full_name as CreatedByName
                            FROM cards c
                            LEFT JOIN users u ON c.created_by = u.id
                            WHERE c.column_id = @ColumnId AND c.tenant_id = @TenantId
                            ORDER BY c.position";

                        var cards = await connection.QueryAsync(cardsSql, new { ColumnId = column.id, TenantId = tenantId });

                        var columnCards = new List<object>();

                        foreach (var card in cards)
                        {
                            var membersSql = @"
                                SELECT u.id, u.full_name as name, u.avatar
                                FROM card_members cm
                                JOIN users u ON cm.user_id = u.id
                                WHERE cm.card_id = @CardId AND cm.tenant_id = @TenantId";

                            var members = await connection.QueryAsync(membersSql, new { CardId = card.id, TenantId = tenantId });

                            var activitiesSql = @"
                                SELECT a.*, u.full_name as UserName
                                FROM activities a
                                LEFT JOIN users u ON a.user_id = u.id
                                WHERE a.card_id = @CardId AND a.tenant_id = @TenantId
                                ORDER BY a.created_at DESC";

                            var activities = await connection.QueryAsync(activitiesSql, new { CardId = card.id, TenantId = tenantId });

                            columnCards.Add(new
                            {
                                id = card.id.ToString(),
                                title = card.title,
                                description = card.description ?? "",
                                priority = card.priority ?? "Medium",
                                dueDate = card.due_date?.ToString("yyyy-MM-dd"),
                                startDate = card.start_date?.ToString("yyyy-MM-dd"),
                                estimatedHours = card.estimated_hours,
                                actualHours = card.actual_hours,
                                position = card.position,
                                color = card.color,
                                tags = card.tags ?? "",
                                members = members.Select(m => new
                                {
                                    id = m.id.ToString(),
                                    name = m.name,
                                    avatar = m.avatar ?? "👤"
                                }),
                                labels = new object[] { },
                                subtasks = new object[] { },
                                attachments = new object[] { },
                                comments = new object[] { },
                                timeEntries = new object[] { },
                                activity = activities.Select(a => new
                                {
                                    id = a.id.ToString(),
                                    type = a.type,
                                    message = a.message,
                                    at = ((DateTimeOffset)a.created_at).ToUnixTimeMilliseconds(),
                                    userName = a.UserName
                                })
                            });
                        }

                        boardColumns.Add(new
                        {
                            id = column.id.ToString(),
                            title = column.title,
                            position = column.position,
                            color = column.color ?? "#6B7280",
                            cards = columnCards
                        });
                    }

                    result.Add(new
                    {
                        id = board.id.ToString(),
                        title = board.title,
                        description = board.description ?? "",
                        color = board.color ?? "#3B82F6",
                        isPublic = board.is_public,
                        isArchived = board.is_archived,
                        ownerName = board.OwnerName,
                        columns = boardColumns,
                        createdAt = board.created_at
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "خطأ في جلب اللوحات", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateBoard([FromBody] CreateBoardRequest request)
        {
            try
            {
                var tenantId = GetTenantId();
                if (tenantId == null)
                    return Unauthorized(new { message = "Tenant context required" });

                // Check board limit
                if (!await _subscriptionService.CanCreateBoardAsync(tenantId.Value))
                {
                    return BadRequest(new { message = "Board limit reached. Upgrade your plan to create more boards." });
                }

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId))
                    userId = 1;

                using var connection = new SqlConnection(_connectionString);

                var sql = @"
                    INSERT INTO boards (title, description, color, owner_id, is_public, is_archived, tenant_id, created_at, updated_at)
                    OUTPUT INSERTED.id
                    VALUES (@Title, @Description, @Color, @OwnerId, @IsPublic, 0, @TenantId, GETDATE(), GETDATE())";

                var boardId = await connection.QuerySingleAsync<int>(sql, new
                {
                    Title = request.Title,
                    Description = request.Description ?? "",
                    Color = request.Color ?? "#3B82F6",
                    OwnerId = userId,
                    IsPublic = request.IsPublic,
                    TenantId = tenantId
                });

                var defaultColumns = new[]
                {
                    new { Title = "قائمة المهام", Position = 1 },
                    new { Title = "قيد التنفيذ", Position = 2 },
                    new { Title = "مكتمل", Position = 3 }
                };

                foreach (var col in defaultColumns)
                {
                    var columnSql = @"
                        INSERT INTO board_columns (board_id, title, position, tenant_id, created_at, updated_at)
                        VALUES (@BoardId, @Title, @Position, @TenantId, GETDATE(), GETDATE())";

                    await connection.ExecuteAsync(columnSql, new
                    {
                        BoardId = boardId,
                        Title = col.Title,
                        Position = col.Position,
                        TenantId = tenantId
                    });
                }

                return Ok(new { id = boardId, message = "تم إنشاء اللوحة بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "خطأ في إنشاء اللوحة", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBoard(int id, [FromBody] UpdateBoardRequest request)
        {
            try
            {
                var tenantId = GetTenantId();
                if (tenantId == null)
                    return Unauthorized(new { message = "Tenant context required" });

                using var connection = new SqlConnection(_connectionString);

                var sql = @"
                    UPDATE boards 
                    SET title = @Title, description = @Description, color = @Color, 
                        is_public = @IsPublic, is_archived = @IsArchived, updated_at = GETDATE()
                    WHERE id = @Id AND tenant_id = @TenantId";

                var rowsAffected = await connection.ExecuteAsync(sql, new
                {
                    Id = id,
                    Title = request.Title,
                    Description = request.Description,
                    Color = request.Color,
                    IsPublic = request.IsPublic,
                    IsArchived = request.IsArchived,
                    TenantId = tenantId
                });

                if (rowsAffected == 0)
                {
                    return NotFound(new { message = "اللوحة غير موجودة" });
                }

                return Ok(new { message = "تم تحديث اللوحة بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "خطأ في تحديث اللوحة", error = ex.Message });
            }
        }

        [HttpGet("{id}/export")]
        public async Task<IActionResult> ExportBoard(int id)
        {
            try
            {
                var tenantId = GetTenantId();
                if (tenantId == null)
                    return Unauthorized(new { message = "Tenant context required" });

                using var connection = new SqlConnection(_connectionString);

                var boardSql = @"SELECT * FROM boards WHERE id = @Id AND tenant_id = @TenantId";
                var board = await connection.QueryFirstOrDefaultAsync(boardSql, new { Id = id, TenantId = tenantId });
                if (board == null)
                    return NotFound(new { message = "اللوحة غير موجودة" });

                var columnsSql = @"SELECT * FROM board_columns WHERE board_id = @BoardId AND tenant_id = @TenantId ORDER BY position";
                var columns = await connection.QueryAsync(columnsSql, new { BoardId = id, TenantId = tenantId });

                var result = new List<object>();
                foreach (var col in columns)
                {
                    var cardsSql = @"SELECT c.*, u.full_name as CreatedByName FROM cards c LEFT JOIN users u ON c.created_by = u.id WHERE c.column_id = @ColumnId AND c.tenant_id = @TenantId ORDER BY c.position";
                    var cards = await connection.QueryAsync(cardsSql, new { ColumnId = col.id, TenantId = tenantId });

                    result.Add(new
                    {
                        column = col.title,
                        cards = cards.Select(c => new
                        {
                            title = c.title,
                            description = c.description ?? "",
                            priority = c.priority ?? "Medium",
                            dueDate = c.due_date?.ToString("yyyy-MM-dd"),
                            createdBy = c.CreatedByName,
                            createdAt = c.created_at?.ToString("yyyy-MM-dd")
                        })
                    });
                }

                return Ok(new
                {
                    boardName = board.title,
                    boardDescription = board.description ?? "",
                    exportedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    columns = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "خطأ في تصدير اللوحة", error = ex.Message });
            }
        }

        [HttpPut("{id}/archive")]
        public async Task<IActionResult> ArchiveBoard(int id, [FromBody] ArchiveBoardRequest request)
        {
            try
            {
                var tenantId = GetTenantId();
                if (tenantId == null)
                    return Unauthorized(new { message = "Tenant context required" });

                using var connection = new SqlConnection(_connectionString);

                var sql = @"
                    UPDATE boards 
                    SET is_archived = @IsArchived, updated_at = GETDATE()
                    WHERE id = @Id AND tenant_id = @TenantId";

                var rowsAffected = await connection.ExecuteAsync(sql, new
                {
                    Id = id,
                    IsArchived = request.IsArchived,
                    TenantId = tenantId
                });

                if (rowsAffected == 0)
                {
                    return NotFound(new { message = "اللوحة غير موجودة" });
                }

                return Ok(new { message = request.IsArchived ? "تم أرشفة اللوحة بنجاح" : "تم إلغاء أرشفة اللوحة بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "خطأ في أرشفة اللوحة", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBoard(int id)
        {
            try
            {
                var tenantId = GetTenantId();
                if (tenantId == null)
                    return Unauthorized(new { message = "Tenant context required" });

                using var connection = new SqlConnection(_connectionString);

                // Delete in correct order due to foreign key constraints
                await connection.ExecuteAsync(
                    "DELETE FROM card_members WHERE card_id IN (SELECT id FROM cards WHERE column_id IN (SELECT id FROM board_columns WHERE board_id = @BoardId)) AND tenant_id = @TenantId",
                    new { BoardId = id, TenantId = tenantId });
                await connection.ExecuteAsync(
                    "DELETE FROM activities WHERE card_id IN (SELECT id FROM cards WHERE column_id IN (SELECT id FROM board_columns WHERE board_id = @BoardId)) AND tenant_id = @TenantId",
                    new { BoardId = id, TenantId = tenantId });
                await connection.ExecuteAsync(
                    "DELETE FROM cards WHERE column_id IN (SELECT id FROM board_columns WHERE board_id = @BoardId) AND tenant_id = @TenantId",
                    new { BoardId = id, TenantId = tenantId });
                await connection.ExecuteAsync(
                    "DELETE FROM board_columns WHERE board_id = @BoardId AND tenant_id = @TenantId",
                    new { BoardId = id, TenantId = tenantId });
                await connection.ExecuteAsync(
                    "DELETE FROM board_members WHERE board_id = @BoardId AND tenant_id = @TenantId",
                    new { BoardId = id, TenantId = tenantId });

                var rowsAffected = await connection.ExecuteAsync(
                    "DELETE FROM boards WHERE id = @Id AND tenant_id = @TenantId",
                    new { Id = id, TenantId = tenantId });

                if (rowsAffected == 0)
                {
                    return NotFound(new { message = "اللوحة غير موجودة" });
                }

                return Ok(new { message = "تم حذف اللوحة بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "خطأ في حذف اللوحة", error = ex.Message });
            }
        }
    }

    public class CreateBoardRequest
    {
        public string Title { get; set; } = "";
        public string? Description { get; set; }
        public string? Color { get; set; }
        public bool IsPublic { get; set; } = false;
    }

    public class UpdateBoardRequest
    {
        public string Title { get; set; } = "";
        public string? Description { get; set; }
        public string? Color { get; set; }
        public bool IsPublic { get; set; } = false;
        public bool IsArchived { get; set; } = false;
    }

    public class ArchiveBoardRequest
    {
        public bool IsArchived { get; set; }
    }
}
