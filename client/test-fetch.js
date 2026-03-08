fetch('http://localhost:5000/api/payments/create-intent', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        doctorId: "747dfe4e-ff28-432b-a2f5-b7019b249b2f",
        date: "2026-03-15",
        timeSlot: "10:00 AM"
    })
})
    .then(res => {
        console.log("Status:", res.status);
        return res.text();
    })
    .then(text => console.log("Response:", text))
    .catch(err => console.error("Fetch err:", err));
