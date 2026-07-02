export type WaypointStatus = 'pending' | 'approved' | 'rejected';

export type Session = {
  id: string;
  pin: string;
  destination: string;
};

export type Waypoint = {
  id: string;
  session_id: string;
  suggested_by: string;
  description: string;
  status: WaypointStatus;
};
