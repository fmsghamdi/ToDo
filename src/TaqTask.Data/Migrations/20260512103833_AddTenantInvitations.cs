using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaqTask.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tenant_invitations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    InvitedByUserId = table.Column<int>(type: "int", nullable: false),
                    InviteeEmail = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Token = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Role = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tenant_invitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tenant_invitations_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

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

            migrationBuilder.CreateIndex(
                name: "IX_tenant_invitations_TenantId",
                table: "tenant_invitations",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_tenant_invitations_Token",
                table: "tenant_invitations",
                column: "Token",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tenant_invitations");

            migrationBuilder.UpdateData(
                table: "tenants",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 5, 12, 7, 59, 11, 142, DateTimeKind.Utc).AddTicks(7794), new DateTime(2026, 5, 12, 7, 59, 11, 142, DateTimeKind.Utc).AddTicks(7927) });

            migrationBuilder.UpdateData(
                table: "users",
                keyColumn: "id",
                keyValue: 1,
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTime(2026, 5, 12, 7, 59, 11, 143, DateTimeKind.Utc).AddTicks(5199), new DateTime(2026, 5, 12, 7, 59, 11, 143, DateTimeKind.Utc).AddTicks(5347) });
        }
    }
}
