using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarberOS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPlatformLogoUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "platform_settings",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "platform_settings");
        }
    }
}
