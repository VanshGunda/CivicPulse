import { useEffect, useState } from 'react';
import { CircleHelp, FileImage, LocateFixed, MapPin, Navigation, Plus, Search, ShieldCheck, UploadCloud, X } from 'lucide-react';
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { departmentApi, issueApi, uploadApi } from '../api/civic.js';
import { getErrorMessage } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import { Alert, Button, EmptyState, ErrorState, Field, PageTitle, StatusBadge } from '../components/UI.jsx';
import { categoryLabel, formatRelative } from '../utils/format.js';

const categories = ['ROAD_DAMAGE', 'WASTE', 'STREETLIGHT', 'WATER_LEAK', 'DRAINAGE', 'PUBLIC_SAFETY', 'PARKS', 'OTHER'];
const mapDefault = [18.5204, 73.8567];

function MapClickTarget({ position, onPick }) {
  useMapEvents({ click(event) { onPick([event.latlng.lat, event.latlng.lng]); } });
  return position ? <CircleMarker center={position} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: '#28795c', fillOpacity: 1 }} /> : null;
}

function LocationPicker({ position, setPosition }) {
  const center = position || mapDefault;
  return <div className="location-map-wrap"><MapContainer center={center} zoom={position ? 15 : 12} scrollWheelZoom={false} className="location-map"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapClickTarget position={position} onPick={setPosition} /></MapContainer><div className="map-instruction"><MapPin size={14} /> Click the map to pin the issue location</div></div>;
}

export default function CreateIssuePage() {
  const [form, setForm] = useState({ title: '', description: '', category: 'ROAD_DAMAGE', address: '', latitude: null, longitude: null, photoUrl: '', departmentId: '' });
  const [position, setPosition] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [departmentsError, setDepartmentsError] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duplicates, setDuplicates] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateChecked, setDuplicateChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const navigate = useNavigate();
  const { notify } = useToast();

  useEffect(() => {
    let active = true;
    departmentApi.list().then((items) => active && setDepartments(items)).catch((err) => active && setDepartmentsError(getErrorMessage(err, 'Departments could not be loaded. You can still submit without choosing one.')));
    return () => { active = false; };
  }, []);

  function update(field, value) { setForm((prev) => ({ ...prev, [field]: value })); if (field === 'category' || field === 'latitude' || field === 'longitude') setDuplicateChecked(false); }

  function pickLocation(nextPosition) {
    setPosition(nextPosition);
    setForm((prev) => ({ ...prev, latitude: Number(nextPosition[0].toFixed(6)), longitude: Number(nextPosition[1].toFixed(6)) }));
    setDuplicateChecked(false);
  }

  function handleFile(nextFile) {
    setFileError('');
    if (!nextFile) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(nextFile.type)) { setFileError('Choose a JPG, PNG or WEBP image.'); return; }
    if (nextFile.size > 5 * 1024 * 1024) { setFileError('Image must be 5 MB or smaller.'); return; }
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
  }

  async function uploadSelectedImage() {
    if (!file) return form.photoUrl;
    setUploading(true); setProgress(0);
    try {
      const response = await uploadApi.image(file, (event) => {
        if (event.total) setProgress(Math.round((event.loaded * 100) / event.total));
      });
      setForm((prev) => ({ ...prev, photoUrl: response.url }));
      return response.url;
    } finally { setUploading(false); }
  }

  async function findDuplicates() {
    if (form.latitude == null || form.longitude == null) { setError('Pin the issue location on the map before checking nearby reports.'); return; }
    setCheckingDuplicates(true); setError('');
    try {
      const results = await issueApi.duplicateCheck({ category: form.category, latitude: form.latitude, longitude: form.longitude, radiusMeters: 500 });
      setDuplicates(results || []); setDuplicateChecked(true);
      if (!results?.length) notify('No active reports were found nearby for this category.', 'success');
    } catch (err) { setError(getErrorMessage(err, 'Could not check nearby reports.')); }
    finally { setCheckingDuplicates(false); }
  }

  async function submit(event) {
    event.preventDefault(); setError('');
    if ((form.latitude == null) !== (form.longitude == null)) { setError('Choose a complete map location, or clear both coordinates.'); return; }
    setSubmitting(true);
    try {
      const photoUrl = file ? await uploadSelectedImage() : form.photoUrl || null;
      const payload = {
        title: form.title.trim(), description: form.description.trim(), category: form.category,
        address: form.address.trim(), latitude: form.latitude, longitude: form.longitude,
        photoUrl, departmentId: form.departmentId ? Number(form.departmentId) : null,
      };
      const response = await issueApi.create(payload);
      const createdIssue = response.issue || response;
      if (response.possibleDuplicates?.length) notify(`Report submitted. We found ${response.possibleDuplicates.length} possible nearby match${response.possibleDuplicates.length === 1 ? '' : 'es'} to review.`, 'info');
      else notify('Your civic issue has been submitted. Thank you for speaking up.');
      navigate(`/issues/${createdIssue.id}`, { replace: true, state: { created: true, possibleDuplicates: response.possibleDuplicates || [] } });
    } catch (err) { setError(getErrorMessage(err, 'Your report could not be submitted. Please check the fields and try again.')); }
    finally { setSubmitting(false); }
  }

  return <div className="page-stack create-page">
    <PageTitle eyebrow="MAKE A DIFFERENCE" title="Report an issue" description="Share clear details so the right team can understand the problem and act." action={<div className="form-secure-note"><ShieldCheck size={16} /> Secure submission</div>} />
    {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
    <form className="create-layout" onSubmit={submit}>
      <div className="create-main-column">
        <section className="surface-card form-card"><div className="form-card-heading"><span className="form-step-number">01</span><div><h3>Tell us what happened</h3><p>Be specific. A good title and clear description help everyone.</p></div></div>
          <Field label="Issue title"><input className="control" value={form.title} maxLength={120} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Large pothole near the bus stop" required /><span className="field-footer"><span>Make it concise and location-specific.</span><span>{form.title.length}/120</span></span></Field>
          <Field label="Category"><div className="category-choice-grid">{categories.map((category, index) => <button type="button" key={category} className={`category-choice ${form.category === category ? 'selected' : ''}`} onClick={() => update('category', category)}><span className={`category-choice-symbol category-symbol-${index}`}>{['↗', '♻', '☼', '≈', '⌁', '✳', '♧', '＋'][index]}</span><span>{categoryLabel(category)}</span>{form.category === category && <span className="choice-check">✓</span>}</button>)}</div></Field>
          <Field label="Description"><textarea className="control textarea-control" value={form.description} maxLength={5000} onChange={(e) => update('description', e.target.value)} placeholder="What is the issue? Where exactly is it? Is it creating a safety concern? Include details that can help the team respond." required rows={5} /><span className="field-footer"><span>Avoid sharing personal or sensitive information.</span><span>{form.description.length}/5000</span></span></Field>
        </section>
        <section className="surface-card form-card"><div className="form-card-heading"><span className="form-step-number">02</span><div><h3>Where is the issue?</h3><p>Pinpoint the location to help your report reach the right people.</p></div></div>
          <Field label="Street address or landmark"><div className="input-wrap form-input-wrap"><MapPin size={17} /><input value={form.address} maxLength={255} onChange={(e) => update('address', e.target.value)} placeholder="Street, landmark, neighborhood" required /></div></Field>
          <LocationPicker position={position} setPosition={pickLocation} />
          <div className="coordinate-row"><div><span className="coordinate-label">Latitude</span><strong>{form.latitude ?? 'Not selected'}</strong></div><div><span className="coordinate-label">Longitude</span><strong>{form.longitude ?? 'Not selected'}</strong></div><button className="btn btn-secondary btn-sm" type="button" onClick={() => { setPosition(null); setForm((prev) => ({ ...prev, latitude: null, longitude: null })); setDuplicateChecked(false); }} disabled={!position}><X size={14} /> Clear pin</button></div>
          <div className="duplicate-check-box"><div className="duplicate-check-icon"><Search size={17} /></div><div className="duplicate-check-copy"><strong>Check for nearby reports</strong><span>We’ll look for active reports in this category within 500 metres.</span></div><Button variant="secondary" size="sm" type="button" loading={checkingDuplicates} onClick={findDuplicates} disabled={form.latitude == null}>Find matches</Button></div>
          {duplicateChecked && <div className="duplicate-results">{duplicates.length ? <><div className="duplicate-results-heading"><strong>{duplicates.length} possible match{duplicates.length === 1 ? '' : 'es'}</strong><span>Review these before you submit.</span></div>{duplicates.slice(0, 4).map((issue) => <a href={`/issues/${issue.id}`} className="duplicate-result" key={issue.id}><span><strong>CP-{String(issue.id).padStart(4, '0')} · {issue.title}</strong><small>{issue.address} · {issue.distanceMeters}m away · {categoryLabel(issue.category)}</small></span><StatusBadge status={issue.status} /></a>)}<span className="duplicate-disclaimer">You can still submit a new report if these are different issues.</span></> : <div className="duplicate-clear"><span>✓</span><div><strong>No nearby matches found</strong><small>Your report looks distinct from current reports in this category.</small></div></div>}</div>}
        </section>
        <section className="surface-card form-card"><div className="form-card-heading"><span className="form-step-number">03</span><div><h3>Add a photo <span className="optional-label">Optional</span></h3><p>A photo can help the team understand the issue faster.</p></div></div>
          <label className={`upload-dropzone ${preview ? 'has-preview' : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFile(e.target.files?.[0])} hidden />
            {preview ? <><img src={preview} alt="Selected report preview" /><span className="upload-preview-overlay"><FileImage size={17} /> {file?.name || 'Selected image'} <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFile(null); setPreview(''); setForm((prev) => ({ ...prev, photoUrl: '' })); }} aria-label="Remove image"><X size={15} /></button></span></> : <><span className="upload-icon"><UploadCloud size={23} /></span><strong>Drop an image here, or <span>browse files</span></strong><small>JPG, PNG or WEBP · up to 5 MB</small></>}
          </label>
          {fileError && <span className="field-error">{fileError}</span>}{uploading && <div className="upload-progress"><span style={{ width: `${progress}%` }} /><small>Uploading image… {progress}%</small></div>}
        </section>
      </div>
      <aside className="create-side-column"><section className="surface-card submit-card"><div className="submit-card-header"><span className="submit-icon"><Navigation size={19} /></span><div><h3>Ready to submit?</h3><p>Take a moment to review your report.</p></div></div><div className="submit-checklist"><div><span className={form.title.trim() ? 'is-done' : ''}>{form.title.trim() ? '✓' : '1'}</span><div><strong>Clear title</strong><small>Describe the problem in a few words.</small></div></div><div><span className={form.description.trim() ? 'is-done' : ''}>{form.description.trim() ? '✓' : '2'}</span><div><strong>Useful details</strong><small>Help the team understand what needs attention.</small></div></div><div><span className={form.address.trim() ? 'is-done' : ''}>{form.address.trim() ? '✓' : '3'}</span><div><strong>Location</strong><small>Add a landmark and map pin when possible.</small></div></div></div>
          <Field label="Suggested department" hint="Optional. The team can reassign this later."><select className="control" value={form.departmentId} onChange={(e) => update('departmentId', e.target.value)}><option value="">Let the team decide</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>{departmentsError && <span className="field-hint">Departments unavailable right now.</span>}</Field>
          <Button type="submit" className="submit-issue-button" size="lg" loading={submitting || uploading} icon={Plus}>Submit report</Button><div className="submit-privacy"><ShieldCheck size={14} /> Your report and status history will be saved securely.</div></section>
        <section className="surface-card guide-card"><div className="guide-card-icon"><CircleHelp size={18} /></div><h3>What happens next?</h3><ol><li><span>01</span>Your report is submitted to the community register.</li><li><span>02</span>A staff member verifies and routes the issue.</li><li><span>03</span>You can follow updates and resolution evidence.</li></ol><div className="guide-foot">Please don’t use CivicPulse to report emergencies.</div></section>
      </aside>
    </form>
  </div>;
}
