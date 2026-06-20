using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarberOS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPenaltyPercentage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PenaltyPercentage",
                table: "users_tenant_roles",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PenaltyPercentage",
                table: "users_tenant_roles");
        }
    }
}
