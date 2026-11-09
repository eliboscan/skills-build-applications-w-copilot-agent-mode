import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type Input = Record<string, unknown>;

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function asInput(value: unknown): Input {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw badRequest('Request body must be an object');
  }
  return value as Input;
}

function requiredText(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw badRequest(`${field} is required`);
  }
  return value.trim();
}

function requiredObjectId(value: unknown, field: string) {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
    throw badRequest(`${field} must be a valid ID`);
  }
  return value;
}

function positiveNumber(value: unknown, field: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw badRequest(`${field} must be a positive number`);
  }
  return value;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(value: unknown) {
  const input = asInput(value);
  const userId = requiredObjectId(input.userId, 'userId');
  const teamId = requiredObjectId(input.teamId, 'teamId');
  const type = requiredText(input.type, 'type');
  const minutes = positiveNumber(input.minutes, 'minutes');
  const points = input.points === undefined ? minutes : input.points;
  if (typeof points !== 'number' || !Number.isFinite(points) || points < 0) {
    throw badRequest('points must be a non-negative number');
  }

  const rawDate = input.occurredAt;
  const occurredAt = rawDate === undefined
    ? new Date()
    : rawDate instanceof Date
      ? rawDate
      : typeof rawDate === 'string' || typeof rawDate === 'number'
        ? new Date(rawDate)
        : null;
  if (!occurredAt || Number.isNaN(occurredAt.getTime())) {
    throw badRequest('occurredAt must be a valid date');
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) throw notFound('User or team not found');

  return Activity.create({ user: userId, team: teamId, type, minutes, points, occurredAt });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(value: unknown) {
  const input = asInput(value);
  const name = requiredText(input.name, 'name');
  const mascot = requiredText(input.mascot, 'mascot');
  const rawMembers = input.members === undefined ? [] : input.members;
  if (!Array.isArray(rawMembers)) throw badRequest('members must be an array');
  const members = [...new Set(rawMembers.map((member) => requiredObjectId(member, 'members')))];

  if (members.length > 0) {
    const memberCount = await User.countDocuments({ _id: { $in: members } });
    if (memberCount !== members.length) throw notFound('One or more team members were not found');
  }

  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate([{ $group: { _id: '$team', totalPoints: { $sum: '$points' } } }]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [String(_id), totalPoints]));

  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(String(team._id)) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw notFound('User not found');

  const activities = await Activity.find({ user: user._id }).select('type').lean();
  const activityFocus = new Map([
    ['run', 'endurance'],
    ['cycle', 'endurance'],
    ['walk', 'mobility'],
    ['strength', 'strength'],
  ]);
  const recentFocus = new Set(activities.map(({ type }) => activityFocus.get(type.toLowerCase())).filter(Boolean));
  const goal = user.fitnessGoal.toLowerCase();
  const workouts = await Workout.find().lean();

  return workouts
    .map((workout) => {
      const focus = workout.focus.toLowerCase();
      const score = Number(focus === goal) * 2 + Number(recentFocus.has(focus));
      return { workout, score };
    })
    .sort((left, right) => right.score - left.score || left.workout.title.localeCompare(right.workout.title))
    .map(({ workout }) => ({
      ...workout,
      reason: workout.focus.toLowerCase() === goal
        ? `Matches your ${workout.focus} fitness goal and recent activity.`
        : recentFocus.has(workout.focus.toLowerCase())
          ? `Matches your recent ${workout.focus} activity.`
          : 'A balanced option for your fitness routine.',
    }));
}

export { User };
