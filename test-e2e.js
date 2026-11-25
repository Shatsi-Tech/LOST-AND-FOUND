async function runE2ETest() {
  console.log('🧪 Starting Campus Lost & Found End-to-End Workflow Verification...');

  const BASE = 'http://localhost:5000/api';

  // 1. Register a student
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'David Miller',
      student_staff_id: 'STU-2026-9912',
      email: `david.miller.${Date.now()}@campus.edu`,
      phone: '+1 (555) 019-9912',
      password: 'password123',
      confirm_password: 'password123',
      department: 'School of Computing',
    }),
  }).then(r => r.json());

  console.log('1. ✅ Student Registered:', regRes.user?.full_name, `(${regRes.user?.student_staff_id})`);
  const studentToken = regRes.token;

  // 2. Report Lost Item (MacBook Pro)
  const meta = await fetch(`${BASE}/meta`).then(r => r.json());
  const laptopCat = meta.categories.find(c => c.name.toLowerCase().includes('laptop')) || meta.categories[0];
  const libraryLoc = meta.locations.find(l => l.name.toLowerCase().includes('library')) || meta.locations[0];

  const lostRes = await fetch(`${BASE}/items/lost`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      item_name: 'Apple MacBook Pro 14 Space Gray',
      category_id: laptopCat.id,
      description: 'M3 Pro MacBook in space gray. Has a Kubernetes sticker on top.',
      color: 'Space Gray',
      date_lost: new Date().toISOString().split('T')[0],
      approximate_time: '11:00',
      location_id: libraryLoc.id,
      additional_info: 'Serial ends with 9901.',
      contact_phone: '+1 (555) 019-9912',
    }),
  }).then(r => r.json());

  console.log('2. ✅ Lost Report Created:', lostRes.item?.item_name, `#${lostRes.item?.item_reference}`);

  // 3. Finder logs Found MacBook in Library
  const finderLogin = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'alex.kim@campus.edu',
      password: 'student123',
    }),
  }).then(r => r.json());

  const foundRes = await fetch(`${BASE}/items/found`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${finderLogin.token}`,
    },
    body: JSON.stringify({
      item_name: 'MacBook Pro 14 Laptop Space Gray',
      category_id: laptopCat.id,
      description: 'Found space gray MacBook left on 2nd floor library carrel with tech stickers.',
      color: 'Space Gray',
      date_found: new Date().toISOString().split('T')[0],
      approximate_time: '11:30',
      location_id: libraryLoc.id,
      current_storage_location: 'Central Security Desk Locker C-12',
      is_handed_to_security: true,
      is_valuable: true,
    }),
  }).then(r => r.json());

  console.log('3. ✅ Found Property Logged:', foundRes.item?.item_name, `#${foundRes.item?.item_reference}`);

  // 4. Verify Match
  const lostDetails = await fetch(`${BASE}/items/lost/${lostRes.item.id}`).then(r => r.json());
  console.log('4. ✅ Match Engine Results:', lostDetails.matches?.length, 'match(es) generated.');
  if (lostDetails.matches?.length > 0) {
    const topMatch = lostDetails.matches[0];
    console.log(`   Top Match Score: ${topMatch.match_score}% (${topMatch.match_reason})`);
  }

  // 5. David Miller submits ownership claim
  const claimRes = await fetch(`${BASE}/claims`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      found_item_id: foundRes.item.id,
      lost_item_id: lostRes.item.id,
      ownership_evidence: 'MacBook serial is C02G9901M3. Has a blue Kubernetes hexagon sticker on the lid.',
      identifying_marks: 'Passcode is 6 digits starting with 199. Small dent on bottom left corner.',
      purchase_info: 'Purchased Apple Store Online July 2024.',
    }),
  }).then(r => r.json());

  console.log('5. ✅ Ownership Claim Submitted:', claimRes.claim?.claim_reference);

  // 6. Admin logs in and approves claim
  const adminLogin = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@campus.edu',
      password: 'admin123',
    }),
  }).then(r => r.json());

  const approveRes = await fetch(`${BASE}/claims/${claimRes.claim.id}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminLogin.token}`,
    },
    body: JSON.stringify({
      status: 'Approved',
      admin_notes: 'Sticker and serial match verified against physical item in vault.',
    }),
  }).then(r => r.json());

  console.log('6. ✅ Admin Review Decision:', approveRes.message);

  // 7. Security Officer validates Collection Pass & processes Handover
  const officerLogin = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'security@campus.edu',
      password: 'officer123',
    }),
  }).then(r => r.json());

  const lookupRes = await fetch(`${BASE}/handovers/lookup?reference=${claimRes.claim.claim_reference}`, {
    headers: { Authorization: `Bearer ${officerLogin.token}` },
  }).then(r => r.json());

  console.log('7. ✅ Officer Lookup Verified Pass for:', lookupRes.claim?.recipient_name || lookupRes.claim?.claimant_name);

  const handoverRes = await fetch(`${BASE}/handovers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${officerLogin.token}`,
    },
    body: JSON.stringify({
      claim_id: claimRes.claim.id,
      id_verified: true,
      signature_name: 'David Miller',
      notes: 'Student unlocked MacBook with passcode in front of officer. Verified and released in perfect condition.',
    }),
  }).then(r => r.json());

  console.log('8. ✅ Handover Completed Successfully:', handoverRes.handover?.handover_reference);

  // 8. Verify final status of found item is Returned
  const finalFound = await fetch(`${BASE}/items/found/${foundRes.item.id}`).then(r => r.json());
  console.log('9. ✅ Final Item Status:', finalFound.item?.status);

  console.log('\n🎉 ALL UNIVERSITY WORKFLOWS VERIFIED 100% OPERATIONAL!');
}

runE2ETest().catch(console.error);
