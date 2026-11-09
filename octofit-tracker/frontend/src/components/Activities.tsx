import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number; occurredAt?: string };
type ActivitiesResponse = { activities?: Activity[] };

export default function Activities() {
  return (
    <CapabilityCard<ActivitiesResponse>
      title="Activities"
      description="Track student activity minutes and points."
      endpoint="/api/activities"
      emptyMessage="No activities yet."
      isEmpty={(data) => !data.activities?.length}
      renderData={(data) => (
        <ul className="list-group list-group-flush">
          {data.activities?.map((activity, index) => (
            <li className="list-group-item px-0" key={`${activity.type}-${activity.occurredAt ?? index}`}>
              <strong>{activity.type}</strong> · {activity.minutes} min · {activity.points} points
            </li>
          ))}
        </ul>
      )}
    />
  );
}
