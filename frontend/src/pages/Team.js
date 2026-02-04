import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Users, Eye, User, Mail, Briefcase } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TeamCard = ({ team, onViewDetails }) => (
  <div className="bg-[#f7f5ef] rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-300 group">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {team.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{team.department}</p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-[#0b1f3b]/5 flex items-center justify-center group-hover:bg-[#0b1f3b]/10 transition-colors">
        <Users className="w-5 h-5 text-[#0b1f3b]" />
      </div>
    </div>
    
    <div className="mt-5 pt-4 border-t border-gray-100 flex items-end justify-between">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Members</p>
        <p className="text-3xl font-bold text-[#0b1f3b] mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {team.member_count}
        </p>
      </div>
      <Button
        onClick={() => onViewDetails(team)}
        size="sm"
        className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white"
        data-testid={`view-team-btn-${team.id}`}
      >
        <Eye className="w-4 h-4 mr-1" />
        View
      </Button>
    </div>
  </div>
);

const Team = () => {
  const { getAuthHeaders } = useAuth();
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, deptsRes] = await Promise.all([
        axios.get(`${API}/teams`, { headers: getAuthHeaders() }),
        axios.get(`${API}/departments`, { headers: getAuthHeaders() })
      ]);
      setTeams(teamsRes.data);
      setDepartments(deptsRes.data);
      // Set first department as active
      if (deptsRes.data.length > 0 && !activeDept) {
        setActiveDept(deptsRes.data[0].name);
      }
    } catch (error) {
      console.error('Team fetch error:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (team) => {
    setSelectedTeam(team);
    try {
      const response = await axios.get(`${API}/teams/${team.id}`, {
        headers: getAuthHeaders()
      });
      setTeamMembers(response.data.members || []);
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load team details');
    }
  };

  const filteredTeams = teams.filter(t => t.department === activeDept);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="team-page">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0b1f3b] flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[#0b1f3b]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Team Dashboard
        </h1>
      </div>

      {/* Department Tabs - Premium Design */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-black/5">
          {departments.map((dept) => {
            const isActive = activeDept === dept.name;
            const deptTeamCount = teams.filter(t => t.department === dept.name).length;
            
            return (
              <button
                key={dept.id}
                onClick={() => setActiveDept(dept.name)}
                className={`
                  relative px-6 py-4 text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-[#0b1f3b] text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
                data-testid={`tab-${dept.name.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <span>{dept.name}</span>
                {isActive && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                    {deptTeamCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Department Summary Card - Premium Design */}
          <div className="bg-[rgb(247,245,239)] rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0b1f3b] flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#0b1f3b]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {activeDept}
                  </h2>
                  <p className="text-sm text-gray-500">Department Overview</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-[#0b1f3b]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {filteredTeams.length}
                </p>
                <p className="text-sm text-gray-500 font-medium">Teams</p>
              </div>
            </div>
          </div>

          {/* Teams Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b1f3b]"></div>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Users className="w-12 h-12 mb-3 text-gray-300" />
              <p>No teams found in this department</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Details Modal - Premium Design */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#fffdf7] max-w-2xl" aria-describedby="team-details-desc">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0b1f3b] flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block">{selectedTeam?.name}</span>
                <span className="text-sm font-normal text-gray-500">{selectedTeam?.department}</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <p id="team-details-desc" className="sr-only">Team details and member list</p>
          
          <div className="py-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[rgb(247,245,239)] rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Department</p>
                <p className="text-lg font-semibold text-[#0b1f3b] mt-1">{selectedTeam?.department}</p>
              </div>
              <div className="bg-[rgb(247,245,239)] rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Members</p>
                <p className="text-lg font-semibold text-[#0b1f3b] mt-1">{teamMembers.length}</p>
              </div>
            </div>
            
            {/* Members List */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Team Members
              </h4>
              {teamMembers.length === 0 ? (
                <div className="text-center py-8 rounded-xl">
                  <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500">No members found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {teamMembers.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0b1f3b] to-[#1e3a5f] flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {member.full_name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.full_name}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span>{member.official_email}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-[#0b1f3b]/10 text-[#0b1f3b] border-0">
                        <Briefcase className="w-3 h-3 mr-1" />
                        {member.designation || 'Employee'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Team;
