using Microsoft.AspNetCore.Mvc;
using src.Hubs;
using src.Models;

namespace src.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        [HttpGet("active")]
        public ActionResult<List<GuestInfo>> GetActiveUsers()
        {
            return Ok(ChatHub._activeGuests);
        }
    }
}
