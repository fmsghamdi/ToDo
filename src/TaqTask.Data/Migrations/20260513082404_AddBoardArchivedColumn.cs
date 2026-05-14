using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaqTask.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBoardArchivedColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_archived",
                table: "boards",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "tenants",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 5, 13, 8, 24, 3, 963, DateTimeKind.Utc).AddTicks(8321), new DateTime(2026, 5, 13, 8, 24, 3, 963, DateTimeKind.Utc).AddTicks(8423) });

            migrationBuilder.UpdateData(
                table: "users",
                keyColumn: "id",
                keyValue: 1,
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTime(2026, 5, 13, 8, 24, 3, 964, DateTimeKind.Utc).AddTicks(4702), new DateTime(2026, 5, 13, 8, 24, 3, 964, DateTimeKind.Utc).AddTicks(4812) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_archived",
                table: "boards");

            migrationBuilder.UpdateData(
                table: "tenants",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 5, 12, 10, 38, 32, 335, DateTimeKind.Utc).AddTicks(4493), new DateTime(2026, 5, 12, 10, 38, 32, 335, DateTimeKind.Utc).AddTicks(4742) });

            migrationBuilder.UpdateData(
                table: "users",
                keyColumn: "id",
                keyValue: 1,
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTime(2026, 5, 12, 10, 38, 32, 336, DateTimeKind.Utc).AddTicks(8984), new DateTime(2026, 5, 12, 10, 38, 32, 336, DateTimeKind.Utc).AddTicks(9242) });
        }
    }
}
