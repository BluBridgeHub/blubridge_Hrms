import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Users, Eye, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TeamCard = ({ team, onViewDetails }) => (
  <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6 hover:shadow-lg transition-all duration-200 card-hover">
    <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
      {team.name}
    </h3>
    
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-sm text-[#004EEB] font-medium">Members</p>
      <p className="text-3xl font-bold mt-1">{team.member_count}</p>
    </div>

    <Button
      onClick={() => onViewDetails(team)}
      className="w-full mt-4 bg-[#0b1f3b] hover:bg-[#162d4d] text-white"
      data-testid={`view-team-btn-${team.id}`}
    >
      View Details
    </Button>
  </div>
);

const Team = () => {
  const { getAuthHeaders } = useAuth();
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState('Research Unit');
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
  const currentDept = departments.find(d => d.name === activeDept);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="team-page">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-[#0b1f3b]" />
        <h1 className="text-2xl font-bold text-[#0b1f3b]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Team Dashboard
        </h1>
      </div>

      {/* Department Tabs */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden">
        <Tabs value={activeDept} onValueChange={setActiveDept} className="w-full">
          <div className="border-b border-black/5">
            <TabsList className="bg-transparent h-auto p-0 flex">
              {departments.map((dept) => (
                <TabsTrigger 
                  key={dept.id}
                  value={dept.name} 
                  className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0b1f3b] data-[state=active]:bg-[#0b1f3b] data-[state=active]:text-white whitespace-nowrap"
                  data-testid={`tab-${dept.name.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  {dept.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {departments.map((dept) => (
            <TabsContent key={dept.id} value={dept.name} className="mt-0 p-6">
              {/* Department Summary */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50/50 rounded-lg">
                <h2 className="text-lg font-semibold text-[#0b1f3b]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {dept.name}
                </h2>
                <div className="text-right">
                  <p className="text-3xl font-bold">{filteredTeams.length}</p>
                  <p className="text-sm text-gray-500">Teams</p>
                </div>
              </div>

              {/* Teams Grid */}
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004EEB]"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTeams.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Team Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#fffdf7] max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>
              {selectedTeam?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-semibold">{selectedTeam?.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="font-semibold">{teamMembers.length}</p>
              </div>
            </div>
            
            <h4 className="font-semibold mb-3">Team Members</h4>
            {teamMembers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No members found</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0b1f3b] flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {member.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">
                      {member.designation || 'Employee'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Team;
