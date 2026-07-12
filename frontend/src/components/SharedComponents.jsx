import { CheckCircle, AlertCircle, Package, Clock } from 'lucide-react';
import { CARD_STYLES, SPACING } from '../utils/constants';

// Loading skeleton for cards
export const CardSkeleton = ({ count = 1, height = 'h-32' }) => {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`${CARD_STYLES.base} p-${SPACING.sm} animate-pulse`}>
          <div className={`bg-[#2A2A32] rounded w-24 mb-${SPACING.xs} h-4`}></div>
          <div className={`bg-[#2A2A32] rounded w-16 ${height}`}></div>
        </div>
      ))}
    </>
  );
};

// Loading skeleton for tables
export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className={CARD_STYLES.base}>
      <table className="w-full">
        <thead className="bg-[#1F1F24] border-b border-[#2A2A32]">
          <tr>
            {[...Array(cols)].map((_, i) => (
              <th key={i} className={`px-${SPACING.sm} py-3`}>
                <div className="h-4 bg-[#2A2A32] rounded w-20 animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2A2A32]">
          {[...Array(rows)].map((_, i) => (
            <tr key={i}>
              {[...Array(cols)].map((_, j) => (
                <td key={j} className={`px-${SPACING.sm} py-${SPACING.xs}`}>
                  <div className="h-4 bg-[#2A2A32] rounded animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Loading skeleton for lists
export const ListSkeleton = ({ items = 5 }) => {
  return (
    <div className={`${CARD_STYLES.base} divide-y divide-[#2A2A32]`}>
      {[...Array(items)].map((_, i) => (
        <div key={i} className={`p-${SPACING.sm} flex items-center gap-${SPACING.xs} animate-pulse`}>
          <div className="w-10 h-10 bg-[#2A2A32] rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-[#2A2A32] rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-[#2A2A32] rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Success empty state
export const EmptyStateSuccess = ({ 
  title = "All caught up! 🎉", 
  description = "Nothing to show right now.",
  icon: IconComponent = CheckCircle 
}) => {
  return (
    <div className={`${CARD_STYLES.base} p-${SPACING.xl} text-center`}>
      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <IconComponent size={32} className="text-green-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

// Neutral empty state
export const EmptyStateNeutral = ({ 
  title = "No items found", 
  description = "Try adjusting your filters or create a new item.",
  icon: IconComponent = Package 
}) => {
  return (
    <div className={`${CARD_STYLES.base} p-${SPACING.xl} text-center`}>
      <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <IconComponent size={32} className="text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

// Warning empty state
export const EmptyStateWarning = ({ 
  title = "Action needed", 
  description = "There are items that require your attention.",
  icon: IconComponent = AlertCircle 
}) => {
  return (
    <div className={`${CARD_STYLES.base} p-${SPACING.xl} text-center`}>
      <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <IconComponent size={32} className="text-amber-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

// Page wrapper with consistent animations
export const PageWrapper = ({ children, className = "" }) => {
  return (
    <div className={`min-h-screen bg-[#0F0F12] flex animate-pageEnter ${className}`}>
      {children}
    </div>
  );
};

// Content area wrapper
export const ContentArea = ({ children, title, description, actions = null }) => {
  return (
    <div className={`flex-1 overflow-y-auto p-${SPACING.md}`}>
      {(title || description || actions) && (
        <div className={`mb-${SPACING.md} flex items-center justify-between`}>
          <div>
            {title && <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>}
            {description && <p className="text-gray-400">{description}</p>}
          </div>
          {actions && <div className="flex gap-4">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};