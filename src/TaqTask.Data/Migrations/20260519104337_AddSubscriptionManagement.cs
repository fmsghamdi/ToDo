using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TaqTask.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptionManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "subscription_plans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DisplayNameAr = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DisplayNameEn = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PriceMonthly = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    PriceYearly = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    MaxUsers = table.Column<int>(type: "int", nullable: false),
                    MaxBoards = table.Column<int>(type: "int", nullable: false),
                    MaxStorageMB = table.Column<int>(type: "int", nullable: false),
                    TrialDays = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Features = table.Column<string>(type: "varchar(2000)", maxLength: 2000, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MoyasarPlanId = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subscription_plans", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "trial_extension_requests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    RequestedDays = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ApprovedBy = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trial_extension_requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_trial_extension_requests_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "tenant_subscriptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    PlanId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TrialStart = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    TrialEnd = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CurrentPeriodStart = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CurrentPeriodEnd = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CancelAtPeriodEnd = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tenant_subscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tenant_subscriptions_subscription_plans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "subscription_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tenant_subscriptions_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    SubscriptionId = table.Column<int>(type: "int", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    Currency = table.Column<string>(type: "varchar(3)", maxLength: 3, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PaymentMethod = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TransactionId = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    GatewayResponse = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_payments_tenant_subscriptions_SubscriptionId",
                        column: x => x.SubscriptionId,
                        principalTable: "tenant_subscriptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_payments_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "subscription_plans",
                columns: new[] { "Id", "CreatedAt", "Description", "DisplayNameAr", "DisplayNameEn", "Features", "IsActive", "MaxBoards", "MaxStorageMB", "MaxUsers", "MoyasarPlanId", "Name", "PriceMonthly", "PriceYearly", "SortOrder", "TrialDays", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 5, 19, 10, 43, 36, 201, DateTimeKind.Utc).AddTicks(8454), "ابدأ بتجربة مجانية لمدة 30 يوم", "مجاني", "Free", "[\"basic_boards\",\"basic_collaboration\"]", true, 5, 100, 10, null, "free", 0m, 0m, 1, 30, new DateTime(2026, 5, 19, 10, 43, 36, 201, DateTimeKind.Utc).AddTicks(8459) },
                    { 2, new DateTime(2026, 5, 19, 10, 43, 36, 202, DateTimeKind.Utc).AddTicks(713), "للفرق الصغيرة", "أساسي", "Basic", "[\"basic_boards\",\"basic_collaboration\",\"advanced_reports\"]", true, 15, 1024, 25, null, "basic", 49m, 499m, 2, 0, new DateTime(2026, 5, 19, 10, 43, 36, 202, DateTimeKind.Utc).AddTicks(713) },
                    { 3, new DateTime(2026, 5, 19, 10, 43, 36, 202, DateTimeKind.Utc).AddTicks(772), "للشركات النامية", "احترافي", "Professional", "[\"basic_boards\",\"basic_collaboration\",\"advanced_reports\",\"priority_support\",\"integrations\"]", true, 50, 5120, 100, null, "pro", 99m, 999m, 3, 0, new DateTime(2026, 5, 19, 10, 43, 36, 202, DateTimeKind.Utc).AddTicks(772) },
                    { 4, new DateTime(2026, 5, 19, 10, 43, 36, 202, DateTimeKind.Utc).AddTicks(775), "للشركات الكبيرة", "مؤسسات", "Enterprise", "[\"basic_boards\",\"basic_collaboration\",\"advanced_reports\",\"priority_support\",\"integrations\",\"sso\",\"audit_logs\",\"api_access\"]", true, 500, 10240, 1000, null, "enterprise", 299m, 2999m, 4, 0, new DateTime(2026, 5, 19, 10, 43, 36, 202, DateTimeKind.Utc).AddTicks(776) }
                });

            migrationBuilder.UpdateData(
                table: "tenants",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 5, 19, 10, 43, 36, 202, DateTimeKind.Utc).AddTicks(9828), new DateTime(2026, 5, 19, 10, 43, 36, 203, DateTimeKind.Utc).AddTicks(59) });

            migrationBuilder.UpdateData(
                table: "users",
                keyColumn: "id",
                keyValue: 1,
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTime(2026, 5, 19, 10, 43, 36, 203, DateTimeKind.Utc).AddTicks(6239), new DateTime(2026, 5, 19, 10, 43, 36, 203, DateTimeKind.Utc).AddTicks(6381) });

            migrationBuilder.InsertData(
                table: "tenant_subscriptions",
                columns: new[] { "Id", "CancelAtPeriodEnd", "CreatedAt", "CurrentPeriodEnd", "CurrentPeriodStart", "PlanId", "Status", "TenantId", "TrialEnd", "TrialStart", "UpdatedAt" },
                values: new object[] { 1, false, new DateTime(2026, 5, 19, 10, 43, 36, 203, DateTimeKind.Utc).AddTicks(2735), new DateTime(2026, 6, 19, 10, 43, 36, 203, DateTimeKind.Utc).AddTicks(2519), new DateTime(2026, 5, 19, 10, 43, 36, 203, DateTimeKind.Utc).AddTicks(2241), 4, "active", 1, new DateTime(2026, 6, 18, 10, 43, 36, 203, DateTimeKind.Utc).AddTicks(2003), new DateTime(2026, 5, 19, 10, 43, 36, 203, DateTimeKind.Utc).AddTicks(1769), new DateTime(2026, 5, 19, 10, 43, 36, 203, DateTimeKind.Utc).AddTicks(2875) });

            migrationBuilder.CreateIndex(
                name: "IX_payments_SubscriptionId",
                table: "payments",
                column: "SubscriptionId");

            migrationBuilder.CreateIndex(
                name: "IX_payments_TenantId",
                table: "payments",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_subscription_plans_Name",
                table: "subscription_plans",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tenant_subscriptions_PlanId",
                table: "tenant_subscriptions",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_tenant_subscriptions_TenantId",
                table: "tenant_subscriptions",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_trial_extension_requests_TenantId",
                table: "trial_extension_requests",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "payments");

            migrationBuilder.DropTable(
                name: "trial_extension_requests");

            migrationBuilder.DropTable(
                name: "tenant_subscriptions");

            migrationBuilder.DropTable(
                name: "subscription_plans");

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
    }
}
