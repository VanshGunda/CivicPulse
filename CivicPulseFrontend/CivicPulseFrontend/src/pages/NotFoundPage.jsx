import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
export default function NotFoundPage() { return <div className="not-found-page"><div className="not-found-graphic"><Compass size={50} /><span>404</span></div><div className="eyebrow">WRONG TURN</div><h1>This path doesn’t lead anywhere.</h1><p>The page might have moved, or the address may be incorrect.</p><Link className="btn btn-primary" to="/"><ArrowLeft size={16} /> Back to overview</Link></div>; }
