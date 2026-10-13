// Example trips shown on first launch. Dates are relative to today so they always look upcoming.
function sampleData() {
  const day = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const b = (id, tripId, type, from, to, [dd, dt], [ad, at], provider, number, confirmation, seat = '', notes = '') => ({
    id, tripId, type, from, to,
    departDate: day(dd), departTime: dt, arriveDate: day(ad), arriveTime: at,
    provider, number, confirmation, seat, notes, sample: true, createdAt: 0,
  });

  const trips = [
    { id: 's-trip-portugal', name: 'Portugal', sample: true },
    { id: 's-trip-pnw', name: 'Seattle & Victoria', sample: true },
    { id: 's-trip-nyc', name: 'New York', sample: true },
    { id: 's-trip-chicago', name: 'Chicago', sample: true },
  ];
  const bookings = [
    b('s-1', 's-trip-portugal', 'flight', 'Boston (BOS)', 'Lisbon (LIS)', [3, '18:30'], [4, '06:45'], 'TAP Air Portugal', 'TP 218', 'X7KQ2P', '23A · Economy', 'Online check-in opens 24 hours before departure. One checked bag included.'),
    b('s-2', 's-trip-portugal', 'train', 'Lisbon (Santa Apolónia)', 'Porto (Campanhã)', [7, '09:09'], [7, '12:04'], 'CP – Comboios de Portugal', 'Alfa Pendular 123', 'CP-48213', 'Car 4 · Seat 62'),
    b('s-3', 's-trip-portugal', 'flight', 'Porto (OPO)', 'Boston (BOS)', [11, '11:20'], [11, '14:05'], 'TAP Air Portugal', 'TP 6229', 'X7KQ2P', '18C · Economy'),
    b('s-4', 's-trip-pnw', 'flight', 'Boston (BOS)', 'Seattle (SEA)', [24, '07:15'], [24, '10:40'], 'Alaska Airlines', 'AS 15', 'LMN4QZ', '9F'),
    b('s-5', 's-trip-pnw', 'ferry', 'Seattle (Pier 69)', 'Victoria, BC', [26, '08:00'], [26, '10:45'], 'Victoria Clipper', '', 'VC-20931', '', 'Bring your passport. This crossing enters Canada.'),
    b('s-6', 's-trip-pnw', 'ferry', 'Victoria, BC', 'Seattle (Pier 69)', [28, '17:00'], [28, '19:45'], 'Victoria Clipper', '', 'VC-20932'),
    b('s-7', 's-trip-pnw', 'flight', 'Seattle (SEA)', 'Boston (BOS)', [29, '13:05'], [29, '21:32'], 'Alaska Airlines', 'AS 24', 'LMN4QZ', '9F'),
    b('s-8', 's-trip-nyc', 'bus', 'Boston (South Station)', 'New York (Port Authority)', [45, '08:00'], [45, '12:35'], 'FlixBus', 'Line 2211', 'FX-993104', 'Seat 12'),
    b('s-9', 's-trip-nyc', 'train', 'New York (Penn Station)', 'Boston (South Station)', [47, '15:05'], [47, '19:20'], 'Amtrak', 'Northeast Regional 171', 'A1B2C3', 'Business class'),
    b('s-10', 's-trip-chicago', 'flight', 'Boston (BOS)', 'Chicago (ORD)', [-40, '09:00'], [-40, '10:55'], 'United Airlines', 'UA 1123', 'QWE7RT'),
    b('s-11', 's-trip-chicago', 'flight', 'Chicago (ORD)', 'Boston (BOS)', [-36, '17:30'], [-36, '20:50'], 'United Airlines', 'UA 2290', 'QWE7RT'),
  ];
  const files = [
    { id: 's-file-1', bookingId: 's-1', name: 'Boarding pass – TP 218', type: 'image/svg+xml', blob: sampleBoardingPass(bookings[0]), addedAt: 0 },
    { id: 's-file-2', bookingId: 's-2', name: 'Train ticket – Lisbon to Porto.pdf', type: 'application/pdf', addedAt: 0,
      blob: samplePDF(['CP - Comboios de Portugal', 'TRAIN TICKET', '', 'Alfa Pendular 123', 'Lisbon (Santa Apolonia) -> Porto (Campanha)',
        `Date: ${bookings[1].departDate}    Departs 09:09    Arrives 12:04`, 'Car 4    Seat 62    2nd class', 'Booking reference: CP-48213', '', 'SAMPLE TICKET - for demonstration only']) },
  ];
  return { trips, bookings, files };
}

function sampleBoardingPass(b) {
  const bars = Array.from({ length: 46 }, (_, i) => {
    const w = [2, 4, 3, 6, 2, 5][(i * 7) % 6];
    return `<rect x="${470 + i * 4.6}" y="200" width="${w / 2}" height="64" fill="#0f172a"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="300" viewBox="0 0 720 300" font-family="Helvetica, Arial, sans-serif">
  <rect width="720" height="300" rx="24" fill="#ffffff"/>
  <path d="M0 24a24 24 0 0 1 24-24h672a24 24 0 0 1 24 24v40H0z" fill="#1d4ed8"/>
  <text x="32" y="41" font-size="20" font-weight="700" fill="#fff" letter-spacing="2">BOARDING PASS</text>
  <text x="688" y="41" font-size="17" fill="#dbeafe" text-anchor="end">TAP Air Portugal · TP 218</text>
  <text x="32" y="138" font-size="60" font-weight="700" fill="#0f172a">BOS</text>
  <text x="32" y="164" font-size="16" fill="#64748b">Boston · 6:30 PM</text>
  <text x="300" y="124" font-size="34" fill="#94a3b8">→</text>
  <text x="400" y="138" font-size="60" font-weight="700" fill="#0f172a">LIS</text>
  <text x="400" y="164" font-size="16" fill="#64748b">Lisbon · 6:45 AM</text>
  <g font-size="12" fill="#64748b" letter-spacing="1"><text x="32" y="212">PASSENGER</text><text x="200" y="212">SEAT</text><text x="300" y="212">GATE</text><text x="32" y="252">DATE</text><text x="200" y="252">BOARDING</text><text x="300" y="252">GROUP</text></g>
  <g font-size="18" font-weight="700" fill="#0f172a"><text x="32" y="232">ALEX TRAVELER</text><text x="200" y="232">23A</text><text x="300" y="232">B12</text><text x="32" y="272">${b.departDate}</text><text x="200" y="272">5:50 PM</text><text x="300" y="272">3</text></g>
  ${bars}
  <text x="576" y="284" font-size="11" fill="#94a3b8" text-anchor="middle">SAMPLE · NOT VALID FOR TRAVEL</text>
</svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

function samplePDF(lines) {
  const text = lines.map((l, i) => `${i ? '0 -26 Td ' : ''}(${l.replace(/[()\\]/g, '\\$&')}) Tj`).join(' ');
  const content = `BT /F1 16 Tf 60 740 Td ${text} ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((obj, i) => {
    const at = pdf.length;
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    return at;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}
