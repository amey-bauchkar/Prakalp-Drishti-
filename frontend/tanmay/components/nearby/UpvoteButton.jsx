import React, { useState } from 'react';
import { Flame, Check } from 'lucide-react';
import { hasUpvotedIssue } from '../../utils/device';

export const UpvoteButton = ({ issueId, initialCount = 1, onUpvote, size = 'md' }) => {
  const isVotedInitially = hasUpvotedIssue(issueId);
  const [voted, setVoted] = useState(isVotedInitially);
  const [animating, setAnimating] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (voted) return;

    setVoted(true);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);

    if (onUpvote) {
      onUpvote(issueId);
    }
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={voted}
      className={`relative inline-flex items-center gap-1.5 font-bold uppercase tracking-wider transition-all duration-200 rounded-lg select-none ${
        isSmall ? 'px-2.5 py-1 text-[10px]' : 'px-3.5 py-2 text-xs'
      } ${
        voted
          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs cursor-default'
          : 'bg-gov-navy hover:bg-gov-navy-light text-gov-accent border border-gov-accent/30 shadow-soft active:scale-95 cursor-pointer'
      } ${animating ? 'scale-105' : ''}`}
      title={voted ? 'You have upvoted this civic issue' : 'Upvote to escalate municipal urgency'}
    >
      {voted ? (
        <>
          <Check className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-600`} />
          <span>Upvoted</span>
          <span className="ml-1 px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded text-[10px] font-mono">
            {initialCount}
          </span>
        </>
      ) : (
        <>
          <Flame className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-gov-accent fill-gov-accent`} />
          <span>Upvote</span>
          <span className="ml-1 px-1.5 py-0.5 bg-gov-navy-light text-white rounded text-[10px] font-mono">
            {initialCount}
          </span>
        </>
      )}
    </button>
  );
};

export default UpvoteButton;
