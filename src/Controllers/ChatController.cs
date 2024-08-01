using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using src.Hubs;

namespace src.Controllers
{
    public class ChatController : Controller
    {
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatController(IHubContext<ChatHub> hubContext)
        {
            _hubContext = hubContext;
        }

        [HttpPost]
        public ActionResult JoinAsGuest(string guestName)
        {
            ViewBag.GuestName = guestName;
            return View("Guest");
        }

        [HttpGet("/Chat/Admin")]
        public ActionResult JoinAsAdmin()
        {
            return View("Admin");
        }

        [HttpPost("/Chat/UploadFile")]
        public async Task<IActionResult> UploadFile(
            IFormFile file,
            bool toAdmin,
            string userConnectionId = ""
        )
        {
            var extension = Path.GetExtension(file.FileName);
            string filename = DateTime.Now.ToString("yyyyMMddHHmmss") + extension;
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads/Docs");

            if (!Directory.Exists(filePath))
            {
                Directory.CreateDirectory(filePath);
            }

            filePath = Path.Combine(filePath, filename);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var request = HttpContext.Request;
            var baseUrl = $"{request.Scheme}://{request.Host}";
            var fileUrl = $"{baseUrl}/Documents/{filename}";

            if (toAdmin)
            {
                await _hubContext
                    .Clients
                    .Client(ChatHub._adminConnectionId)
                    .SendAsync(
                        "ReceiveFileFromUser",
                        userConnectionId,
                        new { Url = fileUrl, Name = file.FileName }
                    );
            }
            else
            {
                await _hubContext
                    .Clients
                    .Client(userConnectionId)
                    .SendAsync("ReceiveFileFromAdmin", new { Url = fileUrl, Name = file.FileName });
            }
            return Ok(new { fileUrl });
        }
    }
}
