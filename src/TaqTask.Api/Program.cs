using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TaqTask.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Add Entity Framework with Database Provider Selection
var dbProvider = builder.Configuration.GetValue<string>("Database:Provider") ?? "MySQL";
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ToDoOSContext>(options =>
{
    switch (dbProvider.ToLower())
    {
        case "mysql":
            var serverVersion = new MySqlServerVersion(new Version(8, 0, 35));
            options.UseMySql(connectionString, serverVersion);
            break;
        case "postgresql":
            options.UseNpgsql(builder.Configuration.GetConnectionString("PostgreSQLConnection"));
            break;
        case "sqlserver":
            options.UseSqlServer(builder.Configuration.GetConnectionString("SqlServerConnection"));
            break;
        default:
            // Default to MySQL
            var defaultServerVersion = new MySqlServerVersion(new Version(8, 0, 35));
            options.UseMySql(connectionString, defaultServerVersion);
            break;
    }
    
    // Enable sensitive data logging in development
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"] ?? "ToDoOS_Super_Secret_Key_2024_Change_In_Production");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "ToDoOS",
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"] ?? "ToDoOS-Users",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseDeveloperExceptionPage();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseRouting();
app.MapControllers();

app.Run();
