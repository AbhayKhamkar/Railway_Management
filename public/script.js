const API_URL = '/api';
let allEvents = [];
let allPlanning = [];

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
    event.target.classList.add('active');
    if(tab === 'reports') updateStats();
}

function openForm() {
    document.getElementById('eventForm').classList.remove('hidden');
}

function closeForm() {
    document.getElementById('eventForm').classList.add('hidden');
}

function openPlanForm() {
    document.getElementById('planForm').classList.remove('hidden');
}

function closePlanForm() {
    document.getElementById('planForm').classList.add('hidden');
}

async function loadEvents() {
    const res = await fetch(`${API_URL}/events`);
    allEvents = await res.json();
    displayEvents();
}

function displayEvents() {
    const list = document.getElementById('eventsList');
    if(allEvents.length === 0) {
        list.innerHTML = '<p style="padding: 20px;">No events yet. Add one!</p>';
        return;
    }
    list.innerHTML = allEvents.map(e => `
        <div class="card">
            <h4>${e.type}</h4>
            <p><strong>Date:</strong> ${new Date(e.dateKey).toLocaleDateString()}</p>
            <p><strong>Station:</strong> ${e.station}</p>
            <p><strong>Zone:</strong> ${e.zone}</p>
            <p><strong>Crowd:</strong> ${e.crowd}</p>
            <p><strong>Level:</strong> <span style="color: ${e.level === 'L-1' ? '#2ECC71' : e.level === 'L-2' ? '#F39C12' : '#DC143C'}">${e.level}</span></p>
            <button onclick="deleteEvent('${e._id}')">Delete</button>
        </div>
    `).join('');
}

async function addEvent() {
    const data = {
        dateKey: document.getElementById('date').value,
        type: document.getElementById('type').value,
        station: document.getElementById('station').value,
        zone: document.getElementById('zone').value,
        crowd: parseInt(document.getElementById('crowd').value),
        level: document.getElementById('level').value,
        division: ''
    };
    await fetch(`${API_URL}/events`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
    closeForm();
    loadEvents();
    alert('Event added!');
}

async function deleteEvent(id) {
    if(confirm('Delete this event?')) {
        await fetch(`${API_URL}/events/${id}`, {method: 'DELETE'});
        loadEvents();
    }
}

async function loadPlanning() {
    const res = await fetch(`${API_URL}/planning`);
    allPlanning = await res.json();
    displayPlanning();
}

function displayPlanning() {
    const list = document.getElementById('planningList');
    if(allPlanning.length === 0) {
        list.innerHTML = '<p style="padding: 20px;">No planning data yet. Add one!</p>';
        return;
    }
    list.innerHTML = allPlanning.map(p => `
        <div class="card">
            <h4>📍 ${p.stationName}</h4>
            <p><strong>Date:</strong> ${new Date(p.dateKey).toLocaleDateString()}</p>
            <p><strong>Crowd:</strong> ${p.expectedCrowd}</p>
            <p><strong>GRP:</strong> ${p.grpStaff} | <strong>RPF:</strong> ${p.rpfStaff}</p>
            <button onclick="deletePlan('${p._id}')">Delete</button>
        </div>
    `).join('');
}

async function addPlan() {
    const data = {
        dateKey: document.getElementById('pDate').value,
        stationName: document.getElementById('pStation').value,
        expectedCrowd: parseInt(document.getElementById('pCrowd').value),
        grpStaff: parseInt(document.getElementById('grp').value),
        rpfStaff: parseInt(document.getElementById('rpf').value),
        commercialStaff: 0,
        trainNumber: '',
        trainType: '',
        trainRoute: ''
    };
    await fetch(`${API_URL}/planning`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
    closePlanForm();
    loadPlanning();
    alert('Planning added!');
}

async function deletePlan(id) {
    if(confirm('Delete this planning?')) {
        await fetch(`${API_URL}/planning/${id}`, {method: 'DELETE'});
        loadPlanning();
    }
}

function updateStats() {
    const l1 = allEvents.filter(e => e.level === 'L-1').length;
    const l2 = allEvents.filter(e => e.level === 'L-2').length;
    const l3 = allEvents.filter(e => e.level === 'L-3').length;
    document.getElementById('total').textContent = allEvents.length;
    document.getElementById('l1').textContent = l1;
    document.getElementById('l2').textContent = l2;
    document.getElementById('l3').textContent = l3;
    displayReports();
}

function displayReports() {
    const list = document.getElementById('reportsList');
    if(allEvents.length === 0) {
        list.innerHTML = '<p style="padding: 20px;">No events yet.</p>';
        return;
    }
    const sorted = [...allEvents].sort((a, b) => new Date(b.dateKey) - new Date(a.dateKey));
    list.innerHTML = sorted.map(e => `
        <div class="card">
            <p><strong>${e.type}</strong> at ${e.station} (${e.zone})</p>
            <p>Date: ${new Date(e.dateKey).toLocaleDateString()} | Crowd: ${e.crowd} | ${e.level}</p>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    loadPlanning();
});
