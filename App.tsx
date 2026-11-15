import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { ProjectState, Node, Track, Layer, SelectedItem, NodeType } from './types';
import { NODE_ICONS, ALL_NODE_TYPES, INITIAL_PROJECT_NAME, NODE_PRESETS } from './constants';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { Spinner } from './components/Spinner';
import { generateText } from './services/geminiService';

const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const initialProjectState: ProjectState = {
  projectName: INITIAL_PROJECT_NAME,
  nodes: {},
  tracks: {},
};

const App: React.FC = () => {
  const [projectState, setProjectState] = useState<ProjectState>(initialProjectState);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState(INITIAL_PROJECT_NAME);
  const [masterPromptOutput, setMasterPromptOutput] = useState<string>('');
  const [isLoadingMasterPrompt, setIsLoadingMasterPrompt] = useState<boolean>(false);
  const [isLoadingInspectorAction, setIsLoadingInspectorAction] = useState<boolean>(false);
  
  const importFileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = `Layertron Director - ${projectState.projectName}`;
  }, [projectState.projectName]);

  useEffect(() => {
    const savedState = localStorage.getItem('layertron_projectState');
    if (savedState) {
      try {
        setProjectState(JSON.parse(savedState));
      } catch (e) {
        console.error("Failed to parse saved project state:", e);
        localStorage.removeItem('layertron_projectState'); // Clear corrupted state
      }
    }
  }, []);

  const saveState = useCallback((stateToSave: ProjectState) => {
    localStorage.setItem('layertron_projectState', JSON.stringify(stateToSave));
  }, []);

  useEffect(() => {
    saveState(projectState);
  }, [projectState, saveState]);


  const handleNewProject = () => {
    if (window.confirm("Are you sure? Unsaved changes will be lost.")) {
      const newState = { ...initialProjectState, projectName: INITIAL_PROJECT_NAME };
      setProjectState(newState);
      setSelectedItem(null);
      setMasterPromptOutput('');
    }
  };

  const handleOpenRenameModal = () => {
    setNewProjectName(projectState.projectName);
    setIsRenameModalOpen(true);
  };

  const handleRenameProject = () => {
    if (newProjectName.trim()) {
      setProjectState(prev => ({ ...prev, projectName: newProjectName.trim() }));
      setIsRenameModalOpen(false);
    }
  };

  const handleImportProject = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let importedData: any = JSON.parse(e.target?.result as string);
        // Migration logic for old Python projects
        if (importedData.project_name && !importedData.projectName) {
          importedData.projectName = importedData.project_name;
          delete importedData.project_name;
        }
        if (importedData.projectName && importedData.nodes && importedData.tracks) {
          // A bit of validation/cleaning for imported data
          const validNodes: Record<string, Node> = {};
          for (const nodeId in importedData.nodes) {
            const node = importedData.nodes[nodeId];
            if (node && node.id && node.name && node.node_type && ALL_NODE_TYPES.includes(node.node_type)) {
              validNodes[nodeId] = {
                id: node.id,
                name: node.name,
                node_type: node.node_type,
                description: node.description || ''
              };
            }
          }
          importedData.nodes = validNodes;
          
          const validTracks: Record<string, Track> = {};
          for (const trackId in importedData.tracks) {
            const track = importedData.tracks[trackId] as any;
            if (track && track.id && track.name ) {
               const validLayers: Record<string, Layer> = {};
                if (track.layers && typeof track.layers === 'object') {
                    for (const layerId in track.layers) {
                        const layer = track.layers[layerId];
                        if (layer && layer.id && layer.name) {
                            validLayers[layerId] = {
                                id: layer.id,
                                name: layer.name,
                                track_id: layer.track_id || trackId,
                                base_prompt: layer.base_prompt || '',
                                connected_node_ids: Array.isArray(layer.connected_node_ids) ? layer.connected_node_ids.filter((id: string) => validNodes[id]) : []
                            };
                        }
                    }
                }
              validTracks[trackId] = {
                id: track.id,
                name: track.name,
                track_type: track.track_type || 'Visual',
                layers: validLayers
              };
            }
          }
          importedData.tracks = validTracks;

          setProjectState(importedData);
          setSelectedItem(null);
          setMasterPromptOutput('');
          alert("Project imported successfully!");
        } else {
          throw new Error("Invalid project file structure.");
        }
      } catch (err: any) {
        alert(`Error importing file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = ''; // Reset file input
  };

  const handleExportProject = () => {
    const { ...dataToExport } = projectState; // No API key to exclude
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const a = document.createElement('a');
    a.download = `${projectState.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_layertron.json`;
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
  };
  
  const handleAddNode = (type: NodeType) => {
    const newNode: Node = {
      id: generateId(),
      name: `New ${type}`,
      node_type: type,
      description: ''
    };
    setProjectState(prev => ({ ...prev, nodes: { ...prev.nodes, [newNode.id]: newNode } }));
    setSelectedItem({ id: newNode.id, type: 'node' });
  };

  const handleAddTrack = () => {
    const newTrack: Track = {
      id: generateId(),
      name: `Visual Track ${Object.keys(projectState.tracks).length + 1}`,
      track_type: 'Visual',
      layers: {}
    };
    setProjectState(prev => ({ ...prev, tracks: { ...prev.tracks, [newTrack.id]: newTrack } }));
  };
  
  const handleAddLayerToTrack = (trackId: string) => {
    const track = projectState.tracks[trackId];
    if (track) {
      const newLayer: Layer = {
        id: generateId(),
        name: `New Layer ${Object.keys(track.layers).length + 1}`,
        track_id: trackId,
        base_prompt: '',
        connected_node_ids: []
      };
      const updatedTrack = { ...track, layers: { ...track.layers, [newLayer.id]: newLayer } };
      setProjectState(prev => ({ ...prev, tracks: { ...prev.tracks, [trackId]: updatedTrack } }));
      setSelectedItem({ id: newLayer.id, type: 'layer' });
    }
  };

  const findLayer = useCallback((layerId: string): Layer | undefined => {
    for (const track of Object.values(projectState.tracks)) {
      if (track.layers[layerId]) {
        return track.layers[layerId];
      }
    }
    return undefined;
  }, [projectState.tracks]);

  const handleUpdateNode = (nodeId: string, data: Partial<Node>) => {
    setProjectState(prev => {
      const nodeToUpdate = prev.nodes[nodeId];
      if (!nodeToUpdate) return prev;
      return { ...prev, nodes: { ...prev.nodes, [nodeId]: { ...nodeToUpdate, ...data } } };
    });
  };

  const handleUpdateLayer = (layerId: string, data: Partial<Layer>) => {
    setProjectState(prev => {
      let trackIdToUpdate: string | null = null;
      let layerToUpdate: Layer | null = null;

      for (const track of Object.values(prev.tracks)) {
        if (track.layers[layerId]) {
          trackIdToUpdate = track.id;
          layerToUpdate = track.layers[layerId];
          break;
        }
      }

      if (!trackIdToUpdate || !layerToUpdate) return prev;
      
      const updatedLayer = { ...layerToUpdate, ...data };
      const updatedTrack = { ...prev.tracks[trackIdToUpdate], layers: { ...prev.tracks[trackIdToUpdate].layers, [layerId]: updatedLayer }};
      return { ...prev, tracks: { ...prev.tracks, [trackIdToUpdate]: updatedTrack }};
    });
  };

  const handleRefineNodeDescription = async () => {
    if (!selectedItem || selectedItem.type !== 'node') return;
    const node = projectState.nodes[selectedItem.id];
    if (!node) return;

    setIsLoadingInspectorAction(true);
    try {
      const metaPrompt = `As a world-building assistant for a creative director, expand this simple concept into a detailed, evocative description in English. Focus on concrete, descriptive details that an image AI model can interpret. The result must be only the description. Do not use markdown. Concept Type: ${node.node_type}, Idea: "${node.description || node.name}".`;
      const { text: result } = await generateText(metaPrompt);
      if (result) {
        handleUpdateNode(node.id, { description: result });
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoadingInspectorAction(false);
    }
  };

  const handleSuggestLayerPrompt = async () => {
    if (!selectedItem || selectedItem.type !== 'layer') return;
    const layer = findLayer(selectedItem.id);
    if (!layer) return;

    const connectedNodes = layer.connected_node_ids.map(id => ({ name: projectState.nodes[id].name, type: projectState.nodes[id].node_type }));
    if (connectedNodes.length === 0) {
      alert("Connect at least one node to suggest a prompt.");
      return;
    }
    
    setIsLoadingInspectorAction(true);
    try {
      const metaPrompt = `You are a creative assistant. Based on these scene elements, write a short, one-sentence Base Prompt in English describing a potential scene. Be concise. Elements: ${JSON.stringify(connectedNodes)}.`;
      const { text: result } = await generateText(metaPrompt);
      if (result) {
        handleUpdateLayer(layer.id, { base_prompt: result.replace(/"/g, '') });
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoadingInspectorAction(false);
    }
  };
  
  const handleComposeMasterPrompt = async () => {
    if (!selectedItem || selectedItem.type !== 'layer') return;
    const layer = findLayer(selectedItem.id);
    if (!layer) return;

    const characters = layer.connected_node_ids.map(id => projectState.nodes[id]).filter(n => n.node_type === NodeType.Character);
    const locations = layer.connected_node_ids.map(id => projectState.nodes[id]).filter(n => n.node_type === NodeType.Location);
    const otherNodes = layer.connected_node_ids.map(id => projectState.nodes[id]).filter(n => n.node_type !== NodeType.Character && n.node_type !== NodeType.Location);
    
    const layerData = { 
      layer_prompt: layer.base_prompt, 
      characters: characters.map(c => ({name: c.name, description: c.description})), // Send only name and description
      location: locations.length > 0 ? {name: locations[0].name, description: locations[0].description} : null,
      other_nodes: otherNodes.map(o => ({name: o.name, type: o.node_type, description: o.description}))
    };

    const metaPrompt = `Act as an expert Prompt Engineer. Synthesize the provided JSON into a master prompt in English.
    **CRITICAL INSTRUCTIONS:**
    1.  **Structure:** Start with the main action/subject from 'layer_prompt'. Immediately introduce the 'characters' and describe them using their full 'description'. Then, describe the 'location' using its full 'description'. Finally, weave in the details from 'other_nodes' (styles, objects, effects) to enrich the entire scene.
    2.  **Full Descriptions:** You MUST use the complete, detailed 'description' for each node. Do not summarize. Consistency is key.
    3.  **Output:** The result must be a single, powerful, and coherent paragraph in English. Use cinematic language. Do not add any extra explanations or markdown.

    JSON DATA:
    ${JSON.stringify(layerData, null, 2)}`;
    
    setIsLoadingMasterPrompt(true);
    setMasterPromptOutput('');
    try {
      const { text: result } = await generateText(metaPrompt);
      setMasterPromptOutput(result);
    } catch (error: any) {
      alert(error.message);
      setMasterPromptOutput(`Error generating prompt: ${error.message}`);
    } finally {
      setIsLoadingMasterPrompt(false);
    }
  };


  // Inspector Panel Input change handler
  const handleInspectorInputChange = (key: string, value: string) => {
    if (!selectedItem) return;
    if (selectedItem.type === 'node') {
      handleUpdateNode(selectedItem.id, { [key]: value } as Partial<Node>);
    } else if (selectedItem.type === 'layer') {
      handleUpdateLayer(selectedItem.id, { [key]: value } as Partial<Layer>);
    }
  };
  
  const handleInspectorCheckboxChange = (nodeId: string, checked: boolean) => {
    if (!selectedItem || selectedItem.type !== 'layer') return;
    const layer = findLayer(selectedItem.id);
    if (!layer) return;

    let newConnectedNodeIds;
    if (checked) {
      newConnectedNodeIds = [...new Set([...layer.connected_node_ids, nodeId])];
    } else {
      newConnectedNodeIds = layer.connected_node_ids.filter(id => id !== nodeId);
    }
    handleUpdateLayer(selectedItem.id, { connected_node_ids: newConnectedNodeIds });
  };
  
  const handleApplyPreset = (preset: string) => {
     if (!selectedItem || selectedItem.type !== 'node') return;
     // Overwrite or append? Let's overwrite for simplicity, acting as a template.
     handleUpdateNode(selectedItem.id, { description: preset });
  };


  return (
    <div className="h-screen w-screen flex flex-col p-2 gap-2 bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="flex-shrink-0 flex justify-between items-center bg-[var(--bg-panel-header)] p-2 rounded-md">
        <h1 className="text-xl font-bold">{projectState.projectName}</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleNewProject}>New</Button>
          <Button size="sm" onClick={handleOpenRenameModal}>Rename...</Button>
          <Button size="sm" onClick={() => importFileInputRef.current?.click()}>Import</Button>
          <input type="file" ref={importFileInputRef} className="hidden" accept=".json" onChange={handleImportProject} />
          <Button size="sm" onClick={handleExportProject}>Export</Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex gap-2 overflow-hidden">
        {/* Left Column: Node Library */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] w-1/4 flex flex-col rounded-md overflow-hidden">
          <div className="bg-[var(--bg-panel-header)] text-lg font-semibold p-2">📚 Node Library</div>
          <div className="p-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {ALL_NODE_TYPES.map(type => (
              <Button 
                key={type} 
                className="w-full text-xs" 
                size="sm"
                onClick={() => handleAddNode(type)}
              >
                {NODE_ICONS[type]} {type}
              </Button>
            ))}
          </div>
          <div className="flex-grow p-2 overflow-y-auto space-y-1">
            {Object.keys(projectState.nodes).length === 0 ? (
              <p className="text-center text-[var(--text-secondary)] text-sm mt-4">No nodes. Add one!</p>
            ) : (
              Object.values(projectState.nodes)
                .sort((a: Node, b: Node) => a.name.localeCompare(b.name))
                .map((node: Node) => {
                  const isSelected = selectedItem?.type === 'node' && selectedItem.id === node.id;
                  
                  // Check if this node is connected to the currently selected layer
                  let isConnectedToSelectedLayer = false;
                  if (selectedItem?.type === 'layer') {
                    const selectedLayer = findLayer(selectedItem.id);
                    if (selectedLayer && selectedLayer.connected_node_ids.includes(node.id)) {
                      isConnectedToSelectedLayer = true;
                    }
                  }

                  let bgClass = 'bg-transparent';
                  if (isSelected) bgClass = 'bg-[var(--accent-blue)]';
                  else if (isConnectedToSelectedLayer) bgClass = 'bg-[var(--bg-input)] ring-1 ring-yellow-500'; // Highlight connected

                  return (
                    <div 
                      key={node.id}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-[var(--accent-blue-hover)] ${bgClass}`}
                      onClick={() => setSelectedItem({ id: node.id, type: 'node' })}
                    >
                      <span>{NODE_ICONS[node.node_type]}</span> 
                      <span>{node.name}</span>
                      {isConnectedToSelectedLayer && <span className="ml-auto text-xs text-yellow-500" title="Connected to selected layer">🔗</span>}
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Middle Column */}
        <div className="w-1/2 flex flex-col gap-2 overflow-hidden">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] h-1/2 flex flex-col rounded-md">
            <div className="bg-[var(--bg-panel-header)] text-lg font-semibold p-2">✨ Master Prompt</div>
            <div className="flex-grow p-3 relative">
              <textarea 
                value={masterPromptOutput}
                readOnly 
                className="w-full h-full bg-transparent resize-none focus:outline-none text-lg text-[var(--text-primary)] border-0"
                placeholder="Compose a master prompt from a layer..."
              />
              {isLoadingMasterPrompt && (
                <div className="absolute inset-0 bg-[var(--bg-panel)] bg-opacity-70 flex items-center justify-center">
                  <Spinner text="Generating..." />
                </div>
              )}
            </div>
          </div>
          <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] h-1/2 flex flex-col rounded-md">
            <div className="bg-[var(--bg-panel-header)] text-lg font-semibold p-2 flex justify-between items-center">
              <span>🎬 Timeline</span>
              <Button size="sm" onClick={handleAddTrack}>Add Track</Button>
            </div>
            <div className="flex-grow p-2 overflow-y-auto space-y-2">
              {Object.keys(projectState.tracks).length === 0 ? (
                <p className="text-center text-[var(--text-secondary)] text-sm mt-4">No tracks. Click "Add Track".</p>
              ) : (
                Object.values(projectState.tracks).map((track: Track) => (
                  <div key={track.id} className="border border-[var(--border-color)] rounded-md">
                    <div className="bg-[var(--bg-panel-header)] p-2 flex justify-between items-center">
                      <span className="font-semibold">➡️ {track.name}</span>
                       <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleAddLayerToTrack(track.id)} 
                          title="Add new layer to this track"
                          className="p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                        </Button>
                    </div>
                    <div className="p-2 space-y-1">
                      {Object.values(track.layers).map((layer: Layer) => {
                        const isSelected = selectedItem?.type === 'layer' && selectedItem.id === layer.id;
                        
                        // Check if this layer uses the currently selected node
                        let usesSelectedNode = false;
                        if (selectedItem?.type === 'node') {
                          if (layer.connected_node_ids.includes(selectedItem.id)) {
                             usesSelectedNode = true;
                          }
                        }

                        let bgClass = 'bg-transparent';
                        if (isSelected) bgClass = 'bg-[var(--accent-blue)]';
                        else if (usesSelectedNode) bgClass = 'bg-[var(--bg-input)] ring-1 ring-yellow-500';

                        return (
                          <div 
                            key={layer.id}
                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-[var(--accent-blue-hover)] ${bgClass}`}
                            onClick={() => setSelectedItem({ id: layer.id, type: 'layer' })}
                          >
                            <span>🎬</span> 
                            <span>{layer.name}</span>
                            {usesSelectedNode && <span className="ml-auto text-xs text-yellow-500" title="Uses selected node">🔗</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Inspector */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] w-1/4 flex flex-col rounded-md overflow-y-auto">
          {!selectedItem ? (
            <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
              <p>Select an item to see its details</p>
            </div>
          ) : selectedItem.type === 'node' ? (
            (() => {
              const node = projectState.nodes[selectedItem.id];
              if (!node) return <p className="p-3 text-[var(--text-secondary)]">Node not found.</p>;
              const presets = NODE_PRESETS[node.node_type] || [];
              
              return (
                <>
                  <div className="bg-[var(--bg-panel-header)] text-lg font-semibold p-2 flex items-center gap-2">
                    <span>{NODE_ICONS[node.node_type]}</span>
                    <span>Inspector: {node.node_type}</span>
                  </div>
                  <div className="p-3 space-y-4">
                    <div>
                      <label htmlFor="node-name" className="text-sm text-[var(--text-secondary)]">Name</label>
                      <input 
                        type="text" 
                        id="node-name"
                        value={node.name} 
                        onChange={(e) => handleInspectorInputChange('name', e.target.value)}
                        className="w-full mt-1" />
                    </div>
                    
                    {/* Preset Dropdown */}
                    {presets.length > 0 && (
                      <div>
                        <label className="text-sm text-[var(--text-secondary)]">Preset / Template</label>
                        <select 
                          className="w-full mt-1"
                          onChange={(e) => {
                             if(e.target.value) handleApplyPreset(e.target.value);
                             e.target.value = ""; // Reset select
                          }}
                        >
                          <option value="">Select a preset to fill description...</option>
                          {presets.map((preset, idx) => (
                            <option key={idx} value={preset}>
                              {preset.length > 50 ? preset.substring(0, 50) + "..." : preset}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label htmlFor="node-desc" className="text-sm text-[var(--text-secondary)]">Description</label>
                      <textarea 
                        id="node-desc"
                        value={node.description} 
                        onChange={(e) => handleInspectorInputChange('description', e.target.value)}
                        className="w-full h-40 mt-1 resize-none" 
                        placeholder="Describe this element or select a preset above..."
                      />
                    </div>
                    <Button 
                        variant="primary" 
                        className="w-full" 
                        onClick={handleRefineNodeDescription}
                        isLoading={isLoadingInspectorAction}
                        loadingText="Refining..."
                    >
                        ✨ Refine Description with AI
                    </Button>
                  </div>
                </>
              );
            })()
          ) : selectedItem.type === 'layer' ? (
            (() => {
              const layer = findLayer(selectedItem.id);
              if (!layer) return <p className="p-3 text-[var(--text-secondary)]">Layer not found.</p>;
              return (
                <>
                  <div className="bg-[var(--bg-panel-header)] text-lg font-semibold p-2">Inspector: Layer</div>
                  <div className="p-3 space-y-4">
                    <div>
                      <label htmlFor="layer-name" className="text-sm text-[var(--text-secondary)]">Layer Name</label>
                      <input 
                        type="text" 
                        id="layer-name"
                        value={layer.name} 
                        onChange={(e) => handleInspectorInputChange('name', e.target.value)}
                        className="w-full mt-1" />
                    </div>
                    <div>
                      <label htmlFor="layer-prompt" className="text-sm text-[var(--text-secondary)]">Base Prompt</label>
                      <div className="flex items-start gap-2 mt-1">
                        <textarea 
                          id="layer-prompt"
                          value={layer.base_prompt} 
                          onChange={(e) => handleInspectorInputChange('base_prompt', e.target.value)}
                          className="w-full h-28 resize-none" />
                        <Button 
                            variant="secondary" 
                            className="p-2" 
                            title="Suggest base prompt with AI"
                            onClick={handleSuggestLayerPrompt}
                            isLoading={isLoadingInspectorAction}
                        >🤖</Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-[var(--text-secondary)]">Connected Nodes</label>
                      <div className="max-h-48 overflow-y-auto bg-[var(--bg-input)] border border-[var(--border-color)] rounded-md p-2 mt-1 space-y-1">
                        {Object.keys(projectState.nodes).length > 0 ? Object.values(projectState.nodes)
                          .sort((a: Node, b: Node) => a.name.localeCompare(b.name))
                          .map((node: Node) => (
                          <label key={node.id} className="flex items-center gap-2 p-1 cursor-pointer hover:bg-gray-700 rounded-md">
                            <input 
                              type="checkbox" 
                              checked={layer.connected_node_ids.includes(node.id)}
                              onChange={(e) => handleInspectorCheckboxChange(node.id, e.target.checked)}
                              className="accent-[var(--accent-blue)]"
                            />
                            <span>{NODE_ICONS[node.node_type]}</span> 
                            <span>{node.name}</span>
                          </label>
                        )) : <p className="text-xs text-[var(--text-secondary)]">No nodes in library.</p>}
                      </div>
                    </div>
                    <Button 
                        variant="primary" 
                        className="w-full font-bold" 
                        onClick={handleComposeMasterPrompt}
                        isLoading={isLoadingMasterPrompt || isLoadingInspectorAction}
                        loadingText="Composing..."
                    >
                        🚀 Compose Master Prompt
                    </Button>
                  </div>
                </>
              );
            })()
          ) : null}
        </div>
      </main>

      {/* Modals */}
      <Modal 
        isOpen={isRenameModalOpen} 
        onClose={() => setIsRenameModalOpen(false)}
        title="Rename Project"
        footerContent={
          <>
            <Button variant="secondary" onClick={() => setIsRenameModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleRenameProject}>Save</Button>
          </>
        }
      >
        <label htmlFor="project-name-input" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">New project name</label>
        <input 
          type="text" 
          id="project-name-input" 
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          className="w-full" 
        />
      </Modal>
    </div>
  );
};

export default App;