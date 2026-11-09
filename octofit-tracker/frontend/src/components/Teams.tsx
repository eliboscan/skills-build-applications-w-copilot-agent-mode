import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot?: string; members?: Array<string | { name?: string }> };
type TeamsResponse = { teams?: Team[] };

export default function Teams() {
  return (
    <CapabilityCard<TeamsResponse>
      title="Teams"
      description="Manage teams and members."
      endpoint="/api/teams"
      emptyMessage="No teams yet."
      isEmpty={(data) => !data.teams?.length}
      renderData={(data) => (
        <ul className="list-group list-group-flush">
          {data.teams?.map((team) => (
            <li className="list-group-item px-0" key={team.name}>
              <strong>{team.name}</strong>{team.mascot ? ` · ${team.mascot}` : ''}
              <div className="small text-body-secondary">
                {team.members?.length ? team.members.map((member) => typeof member === 'string' ? member : member.name ?? 'Member').join(', ') : 'No members'}
              </div>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
