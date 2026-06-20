using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarberOS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixReminderMinutesDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "ReminderMinutesBeforeAppointment",
                table: "barbership_settings",
                type: "integer",
                nullable: false,
                defaultValue: 20,
                oldClrType: typeof(int),
                oldType: "integer");

            // Rows created before this column had a DB-level default were silently backfilled to 0
            // by the earlier migration; restore the intended default for anyone who hasn't changed it.
            migrationBuilder.Sql(
                "UPDATE barbership_settings SET \"ReminderMinutesBeforeAppointment\" = 20 WHERE \"ReminderMinutesBeforeAppointment\" = 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "ReminderMinutesBeforeAppointment",
                table: "barbership_settings",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 20);
        }
    }
}
