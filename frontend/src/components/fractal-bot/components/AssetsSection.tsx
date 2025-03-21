import React, { useState, useRef } from 'react';
import { InformationAsset } from '../types/state';
import { AssetModal } from './AssetModal';

interface AssetsSectionProps {
    assets: InformationAsset[];
    currentStepId: string | null;
    onUpload?: (file: File) => void;
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

// Helper function to download asset content
const downloadAsset = (asset: InformationAsset) => {
    const content = typeof asset.content === 'string'
        ? asset.content
        : JSON.stringify(asset.content, null, 2);

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${asset.name || asset.title || 'asset'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    currentStepId,
    onUpload
}) => {
    const [selectedAsset, setSelectedAsset] = useState<InformationAsset | null>(null);
    const [previewAsset, setPreviewAsset] = useState<{ asset: InformationAsset; position: { x: number; y: number } } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onUpload) {
            onUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && onUpload) {
            onUpload(e.target.files[0]);
        }
    };

    return (
        <div
            className="h-full flex flex-col"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Information Palette
                    </h3>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md
                                 text-gray-700 bg-white hover:bg-gray-50
                                 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
                                 border border-gray-300 dark:border-gray-600
                                 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 relative">
                {isDragging && (
                    <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 border-2 border-dashed border-blue-500 dark:border-blue-400 rounded-lg flex items-center justify-center">
                        <div className="text-blue-500 dark:text-blue-400 text-lg font-medium">
                            Drop file to upload
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                    {assets.map(asset => (
                        <div
                            key={asset.id}
                            className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 
                                     hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all duration-200 p-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                                              ${asset.type === 'data' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                        asset.type === 'analysis_output' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                    {getAssetIcon(asset.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
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
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            downloadAsset(asset);
                                        }}
                                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 
                                                 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
                                                 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Download asset"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setSelectedAsset(asset)}
                                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 
                                                 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
                                                 opacity-0 group-hover:opacity-100 transition-all"
                                        title="View details"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {previewAsset && (
                <HoverPreview
                    asset={previewAsset.asset}
                    position={previewAsset.position}
                />
            )}

            <AssetModal
                asset={selectedAsset}
                onClose={() => setSelectedAsset(null)}
            />
        </div>
    );
};

export type { AssetsSectionProps }; 