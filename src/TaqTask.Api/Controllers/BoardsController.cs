using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;

namespace TaqTask.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BoardsController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public BoardsController(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ?? 
                "Server=localhost;Database=ToDoOS;Integrated Security=true;TrustServerCertificate=true;";
        }

        [HttpGet]
        public async Task<IActionResult> GetBoards()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                
                // Get boards with their columns and cards
                var boardsSql = @"
                    SELECT b.*, u.full_name as OwnerName
                    FROM boards b
                    LEFT JOIN users u ON b.owner_id = u.id
                    ORDER BY b.created_at DESC";

                var boards = await connection.QueryAsync(boardsSql);

                var result = new List<object>();

                foreach (var board in boards)
                {
                    // Get columns for this board
                    var columnsSql = @"
                        SELECT * FROM board_columns 
                        WHERE board_id = @BoardId 
                        ORDER BY position";
                    
                    var columns = await connection.QueryAsync(columnsSql, new { BoardId = board.id });

                    var boardColumns = new List<object>();

                    foreach (var column in columns)
                    {
                        // Get cards for this column
                        var cardsSql = @"
                            SELECT c.*, u.full_name as CreatedByName
                            FROM cards c
                            LEFT JOIN users u ON c.created_by = u.id
                            WHERE c.column_id = @ColumnId
                            ORDER BY c.position";

                        var cards = await connection.QueryAsync(cardsSql, new { ColumnId = column.id });

                        var columnCards = new List<object>();

                        foreach (var card in cards)
                        {
                            // Get card members
                            var membersSql = @"
                                SELECT u.id, u.full_name as name, u.avatar
                                FROM card_members cm
                                JOIN users u ON cm.user_id = u.id
                                WHERE cm.card_id = @CardId";

                            var members = await connection.QueryAsync(membersSql, new { CardId = card.id });

                            // Get card activities
                            var activitiesSql = @"
                                SELECT a.*, u.full_name as UserName
                                FROM activities a
                                LEFT JOIN users u ON a.user_id = u.id
                                WHERE a.card_id = @CardId
                                ORDER BY a.created_at DESC";

                            var activities = await connection.QueryAsync(activitiesSql, new { CardId = card.id });

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
                                labels = new object[] { }, // TODO: Implement labels
                                subtasks = new object[] { }, // TODO: Implement subtasks
                                attachments = new object[] { }, // TODO: Implement attachments
                                comments = new object[] { }, // TODO: Implement comments
                                timeEntries = new object[] { }, // TODO: Implement time entries
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
                using var connection = new SqlConnection(_connectionString);

                var sql = @"
                    INSERT INTO boards (title, description, color, owner_id, is_public, created_at, updated_at)
                    OUTPUT INSERTED.id
                    VALUES (@Title, @Description, @Color, @OwnerId, @IsPublic, GETDATE(), GETDATE())";

                var boardId = await connection.QuerySingleAsync<int>(sql, new
                {
                    Title = request.Title,
                    Description = request.Description ?? "",
                    Color = request.Color ?? "#3B82F6",
                    OwnerId = 1, // Default user for now
                    IsPublic = request.IsPublic
                });

                // Create default columns
                var defaultColumns = new[]
                {
                    new { Title = "قائمة المهام", Position = 1 },
                    new { Title = "قيد التنفيذ", Position = 2 },
                    new { Title = "مكتمل", Position = 3 }
                };

                foreach (var col in defaultColumns)
                {
                    var columnSql = @"
                        INSERT INTO board_columns (board_id, title, position, created_at, updated_at)
                        VALUES (@BoardId, @Title, @Position, GETDATE(), GETDATE())";

                    await connection.ExecuteAsync(columnSql, new
                    {
                        BoardId = boardId,
                        Title = col.Title,
                        Position = col.Position
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
                using var connection = new SqlConnection(_connectionString);

                var sql = @"
                    UPDATE boards 
                    SET title = @Title, description = @Description, color = @Color, 
                        is_public = @IsPublic, updated_at = GETDATE()
                    WHERE id = @Id";

                var rowsAffected = await connection.ExecuteAsync(sql, new
                {
                    Id = id,
                    Title = request.Title,
                    Description = request.Description,
                    Color = request.Color,
                    IsPublic = request.IsPublic
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

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBoard(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                // Delete in correct order due to foreign key constraints
                await connection.ExecuteAsync("DELETE FROM card_members WHERE card_id IN (SELECT id FROM cards WHERE column_id IN (SELECT id FROM board_columns WHERE board_id = @BoardId))", new { BoardId = id });
                await connection.ExecuteAsync("DELETE FROM activities WHERE card_id IN (SELECT id FROM cards WHERE column_id IN (SELECT id FROM board_columns WHERE board_id = @BoardId))", new { BoardId = id });
                await connection.ExecuteAsync("DELETE FROM cards WHERE column_id IN (SELECT id FROM board_columns WHERE board_id = @BoardId)", new { BoardId = id });
                await connection.ExecuteAsync("DELETE FROM board_columns WHERE board_id = @BoardId", new { BoardId = id });
                await connection.ExecuteAsync("DELETE FROM board_members WHERE board_id = @BoardId", new { BoardId = id });
                
                var rowsAffected = await connection.ExecuteAsync("DELETE FROM boards WHERE id = @Id", new { Id = id });

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
    }
}
