import React, { useState, useMemo } from 'react';
import { useNotebook } from '../contexts/NotebookContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const SearchNotebook = () => {
  const { courses, searchNotes } = useNotebook();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const results = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchNotes(searchQuery);
  }, [searchQuery, searchNotes]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Search Header */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-6 sticky top-0 z-10">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Search Notes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across all courses and pages..."
              className="pl-10 bg-white border-slate-300 focus-visible:ring-slate-400"
              autoFocus
            />
          </div>
          {searchQuery.trim() && (
            <p className="mt-3 text-sm text-slate-600">
              Found <span className="font-semibold">{results.length}</span> {results.length === 1 ? 'result' : 'results'}
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-6 max-w-4xl">
          {searchQuery.trim() === '' ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Enter a search term to find notes</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No notes found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result, idx) => (
                <Card
                  key={`${result.courseId}-${result.assignment.id}-${result.note.id}`}
                  className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => setSelectedResult(`${result.courseId}-${result.assignment.id}-${result.note.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          {result.course} &gt; {result.assignment.title}
                        </p>
                        <h3 className="text-lg font-semibold text-slate-800">
                          {result.note.title}
                        </h3>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400 mt-1" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {result.note.content.substring(0, 200)}...
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {result.note.content.split(/\s+/).filter(Boolean).length} words
                      </span>
                      <span>
                        Updated {format(new Date(result.note.updatedAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SearchNotebook;
