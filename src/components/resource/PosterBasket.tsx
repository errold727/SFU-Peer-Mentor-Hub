import { Link } from 'react-router-dom';
import { Layers, X } from 'lucide-react';
import { usePosterBasket } from '../../store/posterBasketStore';
export function PosterBasket() {
  const { items, remove, clear } = usePosterBasket();
  return (
    <aside className="basket">
      <div className="section-heading">
        <Layers size={20} />
        <h2>
          Poster Content <span>({items.length})</span>
        </h2>
      </div>
      {items.length === 0 ? (
        <div className="basket-empty">No resources selected.</div>
      ) : (
        <ul>
          {items.map((i) => (
            <li key={i.id}>
              <span>{i.title}</span>
              <button aria-label={`Remove ${i.title}`} onClick={() => remove(i.id)}>
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Link className="button primary" to="/poster">
        Create Poster →
      </Link>
      {items.length > 0 && (
        <button className="text-button" onClick={clear}>
          Clear basket
        </button>
      )}
    </aside>
  );
}
