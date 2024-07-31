using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace src.Controllers
{
    public class ChatController : Controller
    {
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
    }
}
