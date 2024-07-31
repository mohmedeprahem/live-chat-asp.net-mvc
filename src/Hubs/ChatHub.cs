using Microsoft.AspNetCore.SignalR;
using src.Models;

namespace src.Hubs
{
    public class ChatHub : Hub
    {
        public static List<GuestInfo> _activeGuests = new List<GuestInfo>();

        public static string _adminConnectionId = "";

        public async Task SendMessageToAdmin(string message)
        {
            if (!string.IsNullOrEmpty(_adminConnectionId))
            {
                await Clients
                    .Client(_adminConnectionId)
                    .SendAsync("ReceiveMessageFromUser", Context.ConnectionId, message);
            }
        }

        public async Task sendMessageToUser(string receiverConnectionId, string message)
        {
            await Clients
                .Client(receiverConnectionId)
                .SendAsync("ReceiveMessageFromAdmin", message);
        }

        public async Task JoinAsGuest(string name)
        {
            var guestInfo = new GuestInfo { UserName = name, ConnectionId = Context.ConnectionId };
            _activeGuests.Add(guestInfo);
            if (!string.IsNullOrEmpty(_adminConnectionId))
            {
                await Clients
                    .Client(_adminConnectionId)
                    .SendAsync("NewUserJoin", Context.ConnectionId, name);
            }
        }

        public async Task JoinAsAdmin()
        {
            _adminConnectionId = Context.ConnectionId;
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
            var guestInfo = _activeGuests.First(x => x.ConnectionId == Context.ConnectionId);
            if (guestInfo != null)
            {
                _activeGuests.Remove(guestInfo);
                if (!string.IsNullOrEmpty(_adminConnectionId))
                {
                    await Clients
                        .Client(_adminConnectionId)
                        .SendAsync("UserLeft", guestInfo.ConnectionId);
                }
            }
        }
    }
}
