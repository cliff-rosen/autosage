import React, { useState } from 'react';
import { InformationAsset } from '../types/state';
import { AssetModal } from './AssetModal';

interface AssetsSectionProps {
    assets: InformationAsset[];
    currentStepId: string | null;
}

const getAssetIcon = (type: string) => {
    switch (type) {
        case 'data':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            );
        case 'analysis_output':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            );
        default:
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            );
    }
};

const HoverPreview: React.FC<{ asset: InformationAsset; position: { x: number; y: number } }> = ({ asset, position }) => {
    return (
        <div
            className="fixed z-50 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 
                       animate-fade-in pointer-events-none"
            style={{
                left: `${position.x + 16}px`,
                top: `${position.y}px`,
                maxHeight: '400px',
                overflow: 'hidden'
            }}
        >
            <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                                  ${asset.type === 'data' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                            asset.type === 'analysis_output' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {getAssetIcon(asset.type)}
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {asset.name || asset.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {asset.type} • {new Date(asset.metadata.timestamp).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                    <div className="max-h-48 overflow-y-auto">
                        {Array.isArray(asset.content) ? (
                            <ul className="list-disc list-inside space-y-1">
                                {asset.content.slice(0, 5).map((item, index) => (
                                    <li key={index} className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                        {item}
                                    </li>
                                ))}
                                {asset.content.length > 5 && (
                                    <li className="text-sm text-gray-400 dark:text-gray-500">
                                        +{asset.content.length - 5} more items...
                                    </li>
                                )}
                            </ul>
                        ) : (
                            <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                {JSON.stringify(asset.content, null, 2).slice(0, 200)}
                                {JSON.stringify(asset.content, null, 2).length > 200 ? '...' : ''}
                            </pre>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                    {asset.metadata.tags.map((tag, index) => (
                        <span
                            key={index}
                            className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 
                                     dark:text-gray-400 rounded-full"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const AssetsSection: React.FC<AssetsSectionProps> = ({
    assets,
    currentStepId
}) => {
    const [selectedAsset, setSelectedAsset] = useState<InformationAsset | null>(null);
    const [previewAsset, setPreviewAsset] = useState<{ asset: InformationAsset; position: { x: number; y: number } } | null>(null);

    const handleMouseEnter = (asset: InformationAsset, event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPreviewAsset({
            asset,
            position: {
                x: rect.right,
                y: rect.top
            }
        });
    };

    const handleMouseLeave = () => {
        setPreviewAsset(null);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Information Palette
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 gap-3">
                    {assets.map(asset => (
                        <div
                            key={asset.id}
                            onClick={() => setSelectedAsset(asset)}
                            onMouseEnter={(e) => handleMouseEnter(asset, e)}
                            onMouseLeave={handleMouseLeave}
                            className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 
                                     hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer p-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                                              ${asset.type === 'data' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                        asset.type === 'analysis_output' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                    {getAssetIcon(asset.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 
                                                 dark:group-hover:text-blue-400 transition-colors">
                                        {asset.name || asset.title}
                                    </h5>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(asset.metadata.timestamp).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                                        <div className="flex items-center gap-1">
                                            {asset.metadata.tags.slice(0, 2).map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 
                                                             dark:text-gray-400 rounded-full"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {asset.metadata.tags.length > 2 && (
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    +{asset.metadata.tags.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hover Preview */}
            {previewAsset && (
                <HoverPreview
                    asset={previewAsset.asset}
                    position={previewAsset.position}
                />
            )}

            {/* Full Modal */}
            <AssetModal
                asset={selectedAsset}
                onClose={() => setSelectedAsset(null)}
            />
        </div>
    );
};

export type { AssetsSectionProps }; 