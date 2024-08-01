using Microsoft.Extensions.FileProviders;
using src.Hubs;

var builder = WebApplication.CreateBuilder(args);
var filePath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads/Docs");

if (!Directory.Exists(filePath))
{
    Directory.CreateDirectory(filePath);
}

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.AddSignalR();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}
app.UseStaticFiles();

app.UseStaticFiles(
    new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(
            Path.Combine(Directory.GetCurrentDirectory(), "Uploads/Docs")
        ),
        RequestPath = "/Documents"
    }
);
app.UseStaticFiles(
    new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(
            Path.Combine(Directory.GetCurrentDirectory(), "Uploads/Audio")
        ),
        RequestPath = "/Audio"
    }
);

app.UseRouting();

app.UseAuthorization();

app.UseEndpoints(endpoints =>
{
    endpoints.MapHub<ChatHub>("/chatHub");
});

app.MapControllerRoute(name: "default", pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
