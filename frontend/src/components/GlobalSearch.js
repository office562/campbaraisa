import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  User, 
  Users, 
  X,
  Phone,
  Mail,
  GraduationCap,
  Building2,
  Loader2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GlobalSearch = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ campers: [], parents: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Debounced search
  const searchTimeout = useRef(null);

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults({ campers: [], parents: [] });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(response.data);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search failed:', error);
      setResults({ campers: [], parents: [] });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.length >= 2) {
      searchTimeout.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults({ campers: [], parents: [] });
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, performSearch]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const totalResults = results.campers.length + results.parents.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % totalResults);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalResults) % totalResults);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelectResult(selectedIndex);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectResult = (index) => {
    let currentIndex = 0;
    
    for (const camper of results.campers) {
      if (currentIndex === index) {
        navigate(`/campers/${camper.id}`);
        setIsOpen(false);
        setQuery('');
        return;
      }
      currentIndex++;
    }
    
    for (const parent of results.parents) {
      if (currentIndex === index) {
        // Navigate to first camper of this parent, or show parent info
        if (parent.camper_ids && parent.camper_ids.length > 0) {
          navigate(`/campers/${parent.camper_ids[0]}`);
        }
        setIsOpen(false);
        setQuery('');
        return;
      }
      currentIndex++;
    }
  };

  const hasResults = results.campers.length > 0 || results.parents.length > 0;

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search campers, parents..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-10 bg-white/90 border-gray-200 focus:bg-white transition-colors"
          data-testid="global-search-input"
        />
        {loading && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => {
              setQuery('');
              setResults({ campers: [], parents: [] });
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
          <ScrollArea className="max-h-96">
            {!hasResults && !loading && (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No results found for "{query}"</p>
                <p className="text-xs mt-1">Try searching by name, email, or phone</p>
              </div>
            )}

            {/* Campers Section */}
            {results.campers.length > 0 && (
              <div>
                <div className="px-3 py-2 bg-gray-50 border-b">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <User className="w-4 h-4" />
                    Campers ({results.campers.length})
                  </div>
                </div>
                {results.campers.map((camper, index) => (
                  <div
                    key={camper.id}
                    className={`p-3 cursor-pointer transition-colors border-b last:border-b-0 ${
                      selectedIndex === index ? 'bg-[#E85D04]/10' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      navigate(`/campers/${camper.id}`);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    data-testid={`search-result-camper-${camper.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {camper.photo_url ? (
                        <img 
                          src={camper.photo_url} 
                          alt={camper.first_name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#E85D04]/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-[#E85D04]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#2D241E]">
                          {camper.first_name} {camper.last_name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {camper.grade && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              {camper.grade}
                            </span>
                          )}
                          {camper.yeshiva && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {camper.yeshiva}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={
                        camper.status === 'Paid in Full' ? 'bg-emerald-100 text-emerald-800' :
                        camper.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {camper.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Parents Section */}
            {results.parents.length > 0 && (
              <div>
                <div className="px-3 py-2 bg-gray-50 border-b">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="w-4 h-4" />
                    Parents ({results.parents.length})
                  </div>
                </div>
                {results.parents.map((parent, index) => {
                  const adjustedIndex = results.campers.length + index;
                  return (
                    <div
                      key={parent.id}
                      className={`p-3 cursor-pointer transition-colors border-b last:border-b-0 ${
                        selectedIndex === adjustedIndex ? 'bg-[#E85D04]/10' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (parent.camper_ids && parent.camper_ids.length > 0) {
                          navigate(`/campers/${parent.camper_ids[0]}`);
                        }
                        setIsOpen(false);
                        setQuery('');
                      }}
                      data-testid={`search-result-parent-${parent.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#2D241E]">
                            {parent.father_first_name || parent.first_name} {parent.father_last_name || parent.last_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {parent.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {parent.email}
                              </span>
                            )}
                            {(parent.father_cell || parent.phone) && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {parent.father_cell || parent.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        {parent.camper_count && (
                          <Badge variant="outline">
                            {parent.camper_count} camper{parent.camper_count !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          
          {hasResults && (
            <div className="p-2 bg-gray-50 border-t text-xs text-center text-muted-foreground">
              Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-gray-200 rounded">↓</kbd> to navigate, <kbd className="px-1 py-0.5 bg-gray-200 rounded">Enter</kbd> to select
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
