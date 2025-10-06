
async function bookRoom(roomId, customerInfo) {
   const res = await fetch('https://api.mykhachsan.com/bookings', {
 	method: 'POST',
 	headers: { 'Content-Type': 'application/json' },
 	body: JSON.stringify({ roomId, customerInfo })
   })
   return await res.json()
 }
