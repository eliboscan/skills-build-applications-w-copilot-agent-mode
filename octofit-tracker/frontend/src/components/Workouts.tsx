import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };
type WorkoutsResponse = { suggestions?: Workout[] };

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutsResponse>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      endpoint={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
      emptyMessage="No workout suggestions yet."
      isEmpty={(data) => !data.suggestions?.length}
      renderData={(data) => (
        <ul className="list-group list-group-flush">
          {data.suggestions?.map((workout) => (
            <li className="list-group-item px-0" key={workout.title}>
              <strong>{workout.title}</strong>
              <div>{[workout.focus, workout.minutes ? `${workout.minutes} min` : undefined, workout.difficulty].filter(Boolean).join(' · ')}</div>
              {workout.reason && <p className="mb-0 small text-body-secondary">{workout.reason}</p>}
            </li>
          ))}
        </ul>
      )}
    />
  );
}
