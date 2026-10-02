import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  CheckSquare, 
  Layers, 
  Plus, 
  X, 
  ChevronRight, 
  Edit3, 
  Trash2, 
  Save, 
  Sparkles,
  Check,
  Calendar,
  ListTodo,
  Bookmark,
  FileText,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Copy
} from 'lucide-react';

import initialBuy from '../data/buy';
import initialDo from '../data/do';
import initialOthers from '../data/others';
import initialPlans from '../data/plans';

const COLOR_PRESETS = [
  { name: 'Blue Glow', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', glow: 'rgba(59, 130, 246, 0.4)' },
  { name: 'Pink Rose', color: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)', glow: 'rgba(236, 72, 153, 0.4)' },
  { name: 'Emerald Wave', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16, 185, 129, 0.4)' },
  { name: 'Amber Fire', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245, 158, 11, 0.4)' },
  { name: 'Violet Star', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #d946ef)', glow: 'rgba(139, 92, 246, 0.4)' },
  { name: 'Cyan breeze', color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)', glow: 'rgba(6, 182, 212, 0.4)' }
];

const IconMap = {
  ShoppingBag: ShoppingBag,
  CheckSquare: CheckSquare,
  Layers: Layers,
  Calendar: Calendar,
  Sparkles: Sparkles,
  ListTodo: ListTodo,
  Bookmark: Bookmark,
  FileText: FileText,
  Lightbulb: Lightbulb
};

// Safe Local Storage Load Helpers
const getSavedState = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const getSavedStringState = (key, defaultValue) => {
  const saved = localStorage.getItem(key);
  return saved !== null ? saved : defaultValue;
};

// Split default initial plans (first 3 left, rest right)
const defaultLeftPlans = initialPlans.slice(0, 3);
const defaultRightPlans = initialPlans.slice(3);

const defaultCategories = [
  {
    id: 'cat-left-default',
    title: 'Plans (A-M)',
    side: 'left',
    accentColor: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    iconColor: '#3b82f6',
    collapsed: false,
    plans: defaultLeftPlans
  },
  {
    id: 'cat-right-default',
    title: 'Plans (N-Z)',
    side: 'right',
    accentColor: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    iconColor: '#ec4899',
    collapsed: false,
    plans: defaultRightPlans
  }
];

// Load Categories with Backward-compatible Migration Fallback
const getSavedCategories = () => {
  const savedCats = getSavedState('mindspace_categories', null);
  if (savedCats) return savedCats;

  // Migration fallback: import existing saved left/right plans if present
  const oldLeft = getSavedState('mindspace_left_plans', null);
  const oldRight = getSavedState('mindspace_right_plans', null);
  const oldLeftTitle = getSavedStringState('mindspace_left_sidebar_title', 'Plans (A-M)');
  const oldRightTitle = getSavedStringState('mindspace_right_sidebar_title', 'Plans (N-Z)');

  if (oldLeft || oldRight) {
    return [
      {
        id: 'cat-left-default',
        title: oldLeftTitle,
        side: 'left',
        accentColor: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        iconColor: '#3b82f6',
        collapsed: false,
        plans: oldLeft || defaultLeftPlans
      },
      {
        id: 'cat-right-default',
        title: oldRightTitle,
        side: 'right',
        accentColor: 'linear-gradient(135deg, #ec4899, #f43f5e)',
        iconColor: '#ec4899',
        collapsed: false,
        plans: oldRight || defaultRightPlans
      }
    ];
  }

  return defaultCategories;
};

const getActiveItemsTotal = (drawer) => {
  if (!drawer || !drawer.items) return 0;
  return drawer.items
    .filter(item => !item.deleted && !item.completed)
    .reduce((sum, item) => {
      const val = parseFloat(item.price);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
};

function App() {
  // Dynamic Lists State (Center Cards)
  const [lists, setLists] = useState(() => getSavedState('mindspace_lists', [
    {
      id: 'buy',
      title: 'Buy List',
      description: 'Generic items 1-5. Type here to describe what you want to buy.',
      icon: 'ShoppingBag',
      accentColor: 'var(--neon-blue)',
      iconColor: '#3b82f6',
      glowColor: 'var(--shadow-glow-blue)',
      items: initialBuy
    },
    {
      id: 'do',
      title: 'Do List',
      description: 'Generic tasks 1-5. Type here to describe what you need to do.',
      icon: 'CheckSquare',
      accentColor: 'var(--neon-green)',
      iconColor: '#10b981',
      glowColor: 'var(--shadow-glow-green)',
      items: initialDo
    },
    {
      id: 'others',
      title: 'Others',
      description: 'Miscellaneous items 1-5. Type here to detail other notes.',
      icon: 'Layers',
      accentColor: 'var(--neon-pink)',
      iconColor: '#ec4899',
      glowColor: 'var(--shadow-glow-pink)',
      items: initialOthers
    }
  ]));

  // Dynamic Sided Plan Categories
  const [categories, setCategories] = useState(getSavedCategories);

  // Interactive UI Panel Open/Close States
  const [expandedList, setExpandedList] = useState(null); // listId (string) | null
  const [selectedPlan, setSelectedPlan] = useState(null); // plan object | null
  const [selectedPlanCategoryId, setSelectedPlanCategoryId] = useState(null); // categoryId (string) | null
  
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [activeCategoryForNewPlan, setActiveCategoryForNewPlan] = useState(null);
  
  const [isCreatingList, setIsCreatingList] = useState(false);
  
  // Custom Category Creation Form States (Defaults target side to Right Sidebar)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [newCategorySide, setNewCategorySide] = useState('right'); // Defaults to spawning on the right
  const [newCategoryColorIndex, setNewCategoryColorIndex] = useState(0);

  // Category Renaming State
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryTitleText, setEditingCategoryTitleText] = useState('');
  const [editingCategoryColorIndex, setEditingCategoryColorIndex] = useState(0);

  // Drag and Drop State for Lists (Center)
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [mouseDownCoords, setMouseDownCoords] = useState(null);

  // Drag and Drop State for Plans (Sides)
  const [draggedPlan, setDraggedPlan] = useState(null); // { sourceCategoryId: string, index: number }
  const [dragOverCard, setDragOverCard] = useState(null); // { targetCategoryId: string, index: number } | null

  // Drag and Drop State for Category Boxes
  const [draggedCategoryId, setDraggedCategoryId] = useState(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState(null);

  // Drag and Drop State for Checklist Items
  const [draggedItem, setDraggedItem] = useState(null); // { sourceListId: string, itemId: string }
  const [dragOverItem, setDragOverItem] = useState(null); // { targetListId: string, itemId: string } | null

  // Card Title Inline Editing State (Drawer only)
  const [editingListId, setEditingListId] = useState(null);
  const [editingListTitleText, setEditingListTitleText] = useState('');
  const [editingListIconName, setEditingListIconName] = useState('CheckSquare');
  const [editingListColorIndex, setEditingListColorIndex] = useState(0);

  // Checklist Item Inline Editing State (Drawers only)
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemText, setEditingItemText] = useState('');

  // Collapsible Trash Bin Drawer Open/Close State
  const [isTrashBinOpen, setIsTrashBinOpen] = useState(false);

  // Form Inputs for checklist additions
  const [inputs, setInputs] = useState({}); // { [listId]: text }
  const [drawerInputText, setDrawerInputText] = useState('');
  
  // Plan Creation Form Inputs
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanSummary, setNewPlanSummary] = useState('');
  const [newPlanContent, setNewPlanContent] = useState('');
  const [newPlanColorIndex, setNewPlanColorIndex] = useState(0);

  // Plan Edit Form Inputs
  const [editPlanTitle, setEditPlanTitle] = useState('');
  const [editPlanSummary, setEditPlanSummary] = useState('');
  const [editPlanContent, setEditPlanContent] = useState('');
  const [editPlanColorIndex, setEditPlanColorIndex] = useState(0);

  // List Creation Form Inputs
  const [newListTitle, setNewListTitle] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [newListIconName, setNewListIconName] = useState('CheckSquare');
  const [newListColorIndex, setNewListColorIndex] = useState(0);

  // Sync to Local Storage on state modifications
  useEffect(() => {
    localStorage.setItem('mindspace_lists', JSON.stringify(lists));
  }, [lists]);

  useEffect(() => {
    localStorage.setItem('mindspace_categories', JSON.stringify(categories));
  }, [categories]);


  // Native Drag and Drop handlers for Lists (Center Cards)
  const handleDragStart = (e, index) => {
    if (editingListId !== null || editingItemId !== null) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const reorderedLists = [...lists];
    const draggedItem = reorderedLists[draggedIndex];
    reorderedLists.splice(draggedIndex, 1);
    reorderedLists.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setLists(reorderedLists);
  };

  const handleDragEnd = (e) => {
    setDraggedIndex(null);
    e.currentTarget.classList.remove('dragging');
  };


  // Native Drag and Drop handlers for Plans (Sided Cards)
  const handlePlanDragStart = (e, categoryId, index) => {
    setDraggedPlan({ sourceCategoryId: categoryId, index });
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  // Perform plan card reorders/transfers inside categories on drop release
  const handlePlanDropOnCard = (e, targetCategoryId, targetIdx) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCard(null);

    if (!draggedPlan) return;
    const { sourceCategoryId, index } = draggedPlan;

    // Retrieve and remove card from source category
    let movedCard = null;
    const updatedCategories = categories.map(cat => {
      if (cat.id === sourceCategoryId) {
        const plans = [...cat.plans];
        movedCard = plans.splice(index, 1)[0];
        return { ...cat, plans };
      }
      return cat;
    });

    if (!movedCard) return;

    // Insert card into target category at targetIdx
    const finalCategories = updatedCategories.map(cat => {
      if (cat.id === targetCategoryId) {
        const plans = [...cat.plans];
        plans.splice(targetIdx, 0, movedCard);
        return { ...cat, plans };
      }
      return cat;
    });

    setCategories(finalCategories);
  };

  // Append plan card to bottom of category when dropping on empty category container space
  const handlePlanDropOnContainer = (e, targetCategoryId) => {
    e.preventDefault();
    setDragOverCard(null);

    if (!draggedPlan) return;
    const { sourceCategoryId, index } = draggedPlan;

    // Retrieve and remove card from source category
    let movedCard = null;
    const updatedCategories = categories.map(cat => {
      if (cat.id === sourceCategoryId) {
        const plans = [...cat.plans];
        movedCard = plans.splice(index, 1)[0];
        return { ...cat, plans };
      }
      return cat;
    });

    if (!movedCard) return;

    // Append card to target category
    const finalCategories = updatedCategories.map(cat => {
      if (cat.id === targetCategoryId) {
        const plans = [...cat.plans];
        plans.push(movedCard);
        return { ...cat, plans };
      }
      return cat;
    });

    setCategories(finalCategories);
  };

  const handlePlanDragEnd = (e) => {
    setDraggedPlan(null);
    setDragOverCard(null);
    e.currentTarget.classList.remove('dragging');
  };


  // Native Category Drag and Drop Handlers (Reorder & cross-sidebar moves)
  const handleCategoryDragStart = (e, catId) => {
    // Prevent dragging if user starts dragging on input fields or action buttons
    if (e.target.closest('button') || e.target.closest('input')) {
      e.preventDefault();
      return;
    }
    setDraggedCategoryId(catId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Drop category over another category (swaps index and adopts target sidebar side)
  const handleCategoryDropOnCategory = (e, targetCatId, targetSide) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedCategoryId || draggedCategoryId === targetCatId) return;

    const cats = [...categories];
    const sourceIdx = cats.findIndex(c => c.id === draggedCategoryId);
    const targetIdx = cats.findIndex(c => c.id === targetCatId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const draggedCat = cats[sourceIdx];
    draggedCat.side = targetSide; // Adopt target side workspace column

    cats.splice(sourceIdx, 1);
    
    // Re-locate target index since splice modified array size
    const newTargetIdx = cats.findIndex(c => c.id === targetCatId);
    cats.splice(newTargetIdx, 0, draggedCat);

    setCategories(cats);
    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
  };

  // Drop category on sidebar general container background area (transfers side)
  const handleCategoryDropOnSidebar = (e, targetSide) => {
    e.preventDefault();
    if (!draggedCategoryId) return;

    setCategories(categories.map(cat => 
      cat.id === draggedCategoryId ? { ...cat, side: targetSide } : cat
    ));
    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
  };

  const handleCategoryDragEnd = (e) => {
    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
  };

  // Native Drag and Drop Handlers for Checklist Items
  const handleItemDragStart = (e, sourceListId, itemId) => {
    setDraggedItem({ sourceListId, itemId });
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('item-dragging');
  };

  const handleItemDragEnter = (targetListId, itemId) => {
    if (draggedItem) {
      setDragOverItem({ targetListId, itemId });
    }
  };

  const handleItemDropOnItem = (e, targetListId, targetItemId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverItem(null);

    if (!draggedItem) return;
    const { sourceListId, itemId } = draggedItem;

    // Find and remove item from source list
    let itemToMove = null;
    const updatedLists = lists.map(list => {
      if (list.id === sourceListId) {
        const items = [...list.items];
        const idx = items.findIndex(item => item.id === itemId);
        if (idx !== -1) {
          itemToMove = items.splice(idx, 1)[0];
        }
        return { ...list, items };
      }
      return list;
    });

    if (!itemToMove) return;

    // Insert item into target list at targetItemId's position
    const finalLists = updatedLists.map(list => {
      if (list.id === targetListId) {
        const items = [...list.items];
        const targetIdx = items.findIndex(item => item.id === targetItemId);
        if (targetIdx !== -1) {
          items.splice(targetIdx, 0, itemToMove);
        } else {
          items.push(itemToMove);
        }
        return { ...list, items };
      }
      return list;
    });

    setLists(finalLists);
    setDraggedItem(null);
  };

  const handleItemDropOnContainer = (e, targetListId) => {
    e.preventDefault();
    setDragOverItem(null);

    // If we are dragging a list card, let list drop handle it, don't trigger item drop!
    if (!draggedItem) return;
    const { sourceListId, itemId } = draggedItem;

    // Find and remove item from source list
    let itemToMove = null;
    const updatedLists = lists.map(list => {
      if (list.id === sourceListId) {
        const items = [...list.items];
        const idx = items.findIndex(item => item.id === itemId);
        if (idx !== -1) {
          itemToMove = items.splice(idx, 1)[0];
        }
        return { ...list, items };
      }
      return list;
    });

    if (!itemToMove) return;

    // Append to target list
    const finalLists = updatedLists.map(list => {
      if (list.id === targetListId) {
        return {
          ...list,
          items: [...list.items, itemToMove]
        };
      }
      return list;
    });

    setLists(finalLists);
    setDraggedItem(null);
  };

  const handleItemDragEnd = (e) => {
    setDraggedItem(null);
    setDragOverItem(null);
    e.currentTarget.classList.remove('item-dragging');
  };


  // Dynamic Category state actions
  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCategoryTitle.trim()) return;

    const selectedPreset = COLOR_PRESETS[newCategoryColorIndex];
    const newCat = {
      id: `cat-${Date.now()}`,
      title: newCategoryTitle.trim(),
      side: newCategorySide,
      accentColor: selectedPreset.gradient,
      iconColor: selectedPreset.color,
      collapsed: false,
      plans: []
    };

    setCategories([...categories, newCat]);
    setIsCreatingCategory(false);

    // Reset Form
    setNewCategoryTitle('');
    setNewCategorySide('right'); // Defaults category side selection to right side
    setNewCategoryColorIndex(0);
  };

  const handleDeleteCategory = (catId) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    if (window.confirm(`Are you sure you want to delete the category "${cat.title}"? All plan balloons inside it will be lost.`)) {
      setCategories(categories.filter(c => c.id !== catId));
    }
  };

  const startEditingCategory = (catId, currentTitle, currentGradient) => {
    setEditingCategoryId(catId);
    setEditingCategoryTitleText(currentTitle);
    const colorIdx = COLOR_PRESETS.findIndex(p => p.gradient === currentGradient || p.color === currentGradient);
    setEditingCategoryColorIndex(colorIdx !== -1 ? colorIdx : 0);
  };

  const saveCategoryTitle = (catId) => {
    if (!editingCategoryTitleText.trim()) return;
    const selectedPreset = COLOR_PRESETS[editingCategoryColorIndex];
    setCategories(categories.map(cat => 
      cat.id === catId 
        ? { 
            ...cat, 
            title: editingCategoryTitleText.trim(),
            accentColor: selectedPreset.gradient,
            iconColor: selectedPreset.color
          } 
        : cat
    ));
    setEditingCategoryId(null);
  };

  // Toggle maximize and minimize category states
  const handleToggleCategoryCollapse = (catId) => {
    setCategories(categories.map(cat => 
      cat.id === catId ? { ...cat, collapsed: !cat.collapsed } : cat
    ));
  };


  // Card Title Edit Handlers (Drawer View)
  const startEditingTitle = (listId, currentTitle, currentIcon, currentGradient) => {
    setEditingListId(listId);
    setEditingListTitleText(currentTitle);
    setEditingListIconName(currentIcon || 'CheckSquare');
    
    const colorIdx = COLOR_PRESETS.findIndex(p => p.gradient === currentGradient || p.color === currentGradient);
    setEditingListColorIndex(colorIdx !== -1 ? colorIdx : 0);
  };

  const saveListConfig = (listId) => {
    if (!editingListTitleText.trim()) return;
    const selectedPreset = COLOR_PRESETS[editingListColorIndex];
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          title: editingListTitleText.trim(),
          icon: editingListIconName,
          accentColor: selectedPreset.gradient,
          iconColor: selectedPreset.color,
          glowColor: `0 12px 40px -10px ${selectedPreset.glow}`
        };
      }
      return list;
    }));
    setEditingListId(null);
  };

  const cancelEditingTitle = () => {
    setEditingListId(null);
  };

  // Checklist Item Inline Editing State (Drawers only)
  const startEditingItem = (itemId, currentText) => {
    setEditingItemId(itemId);
    setEditingItemText(currentText);
  };

  const saveChecklistItem = (listId, itemId) => {
    if (!editingItemText.trim()) return;
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.map(item => 
            item.id === itemId ? { ...item, text: editingItemText.trim() } : item
          )
        };
      }
      return list;
    }));
    setEditingItemId(null);
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
  };

  // Move active checklist items up/down to sort
  const handleMoveItem = (listId, itemId, direction) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        const items = [...list.items];
        const activeItems = items.filter(item => !item.deleted);
        const deletedItems = items.filter(item => item.deleted);
        
        const idx = activeItems.findIndex(item => item.id === itemId);
        if (idx === -1) return list;

        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= activeItems.length) return list; // Out of bounds

        // Swap positions within activeItems
        const temp = activeItems[idx];
        activeItems[idx] = activeItems[targetIdx];
        activeItems[targetIdx] = temp;

        return {
          ...list,
          items: [...activeItems, ...deletedItems]
        };
      }
      return list;
    }));
  };

  // Checklist Items toggle/add/delete actions
  const handleToggleItem = (listId, itemId) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item)
        };
      }
      return list;
    }));
  };

  const handleResetListItems = (listId) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.map(item => ({ ...item, completed: false }))
        };
      }
      return list;
    }));
  };

  const handleDuplicateList = (listId) => {
    const listToDuplicate = lists.find(l => l.id === listId);
    if (!listToDuplicate) return;

    const duplicatedList = {
      ...listToDuplicate,
      id: `list-${Date.now()}`,
      title: `${listToDuplicate.title} (Copy)`,
      items: listToDuplicate.items.map(item => ({
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    };

    const originalIndex = lists.findIndex(l => l.id === listId);
    const updatedLists = [...lists];
    updatedLists.splice(originalIndex + 1, 0, duplicatedList);
    setLists(updatedLists);
  };

  const handleDuplicateCategory = (catId) => {
    const catToDuplicate = categories.find(c => c.id === catId);
    if (!catToDuplicate) return;

    const duplicatedCat = {
      ...catToDuplicate,
      id: `cat-${Date.now()}`,
      title: `${catToDuplicate.title} (Copy)`,
      plans: catToDuplicate.plans.map(plan => ({
        ...plan,
        id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    };

    const originalIndex = categories.findIndex(c => c.id === catId);
    const updatedCats = [...categories];
    updatedCats.splice(originalIndex + 1, 0, duplicatedCat);
    setCategories(updatedCats);
  };

  const handleDuplicatePlan = (planId, categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    const planToDuplicate = category.plans.find(p => p.id === planId);
    if (!planToDuplicate) return;

    const duplicatedPlan = {
      ...planToDuplicate,
      id: `plan-${Date.now()}`,
      title: `${planToDuplicate.title} (Copy)`,
      priority: 0
    };

    const originalIndex = category.plans.findIndex(p => p.id === planId);
    const updatedPlans = [...category.plans];
    updatedPlans.splice(originalIndex + 1, 0, duplicatedPlan);

    setCategories(categories.map(cat => 
      cat.id === categoryId ? { ...cat, plans: updatedPlans } : cat
    ));

    setSelectedPlan(duplicatedPlan);
  };

  const handleCardMouseDown = (e) => {
    if (e.button !== 0) return;
    setMouseDownCoords({ x: e.clientX, y: e.clientY });
  };

  const handleCardClick = (e, listId) => {
    if (
      e.target.closest('button') || 
      e.target.closest('input') || 
      e.target.closest('textarea') || 
      e.target.closest('form') ||
      e.target.closest('.checklist-item')
    ) {
      return;
    }
    
    if (mouseDownCoords) {
      const dx = e.clientX - mouseDownCoords.x;
      const dy = e.clientY - mouseDownCoords.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 5) return;
    }

    setExpandedList(listId);
  };

  const handleUpdateItemPrice = (listId, itemId, newPrice) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.map(item => 
            item.id === itemId ? { ...item, price: newPrice } : item
          )
        };
      }
      return list;
    }));
  };

  const handleUpdateDescription = (listId, newDesc) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return { ...list, description: newDesc };
      }
      return list;
    }));
  };

  const handleAddItem = (listId, text) => {
    if (!text.trim()) return;

    const newItem = {
      id: `item-${Date.now()}`,
      text: text.trim(),
      completed: false,
      deleted: false
    };

    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: [...list.items, newItem]
        };
      }
      return list;
    }));
  };

  // Safe item deletion: moves active items to hidden section (deleted: true), permanently destroys hidden items
  const handleDeleteItem = (listId, itemId) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        const itemToChange = list.items.find(item => item.id === itemId);
        if (itemToChange && itemToChange.deleted) {
          // Permanently delete
          return {
            ...list,
            items: list.items.filter(item => item.id !== itemId)
          };
        } else {
          // Move to hidden trash section
          return {
            ...list,
            items: list.items.map(item => item.id === itemId ? { ...item, deleted: true } : item)
          };
        }
      }
      return list;
    }));
  };

  // Restore deleted checklist item
  const handleRestoreItem = (listId, itemId) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.map(item => item.id === itemId ? { ...item, deleted: false } : item)
        };
      }
      return list;
    }));
  };

  // Add list item from dashboard card form
  const handleAddItemDirect = (e, listId) => {
    e.preventDefault();
    const text = inputs[listId] || '';
    handleAddItem(listId, text);
    setInputs({ ...inputs, [listId]: '' });
  };

  // Create custom middle list card
  const handleCreateList = (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    const selectedPreset = COLOR_PRESETS[newListColorIndex];
    const listId = `list-${Date.now()}`;
    const newList = {
      id: listId,
      title: newListTitle.trim(),
      description: newListDesc.trim() || 'Custom checklist category.',
      icon: newListIconName,
      accentColor: selectedPreset.gradient,
      iconColor: selectedPreset.color, // Keeps preset solid color
      glowColor: `0 12px 40px -10px ${selectedPreset.glow}`,
      items: []
    };

    setLists([...lists, newList]);
    setIsCreatingList(false);

    // Reset Form
    setNewListTitle('');
    setNewListDesc('');
    setNewListIconName('CheckSquare');
    setNewListColorIndex(0);
  };

  // Delete middle list card with confirmation
  const handleDeleteList = (listId) => {
    if (window.confirm("Are you sure you want to delete this list card? All its items will be permanently lost.")) {
      setLists(lists.filter(l => l.id !== listId));
      if (expandedList === listId) {
        setExpandedList(null);
      }
    }
  };

  // Sided Plan Card actions
  const handleOpenPlan = (plan, categoryId) => {
    setSelectedPlan(plan);
    setSelectedPlanCategoryId(categoryId);
    setEditPlanTitle(plan.title);
    setEditPlanSummary(plan.summary);
    setEditPlanContent(plan.content);
    
    const idx = COLOR_PRESETS.findIndex(p => p.gradient === plan.gradient);
    setEditPlanColorIndex(idx !== -1 ? idx : 0);
    setIsEditing(false);
  };

  const handleSavePlanEdit = (e) => {
    e.preventDefault();
    if (!editPlanTitle.trim() || !selectedPlanCategoryId) return;

    const selectedPreset = COLOR_PRESETS[editPlanColorIndex];
    const updatedPlan = {
      ...selectedPlan,
      title: editPlanTitle.trim(),
      summary: editPlanSummary.trim(),
      content: editPlanContent.trim(),
      gradient: selectedPreset.gradient,
      glow: selectedPreset.glow,
      priority: selectedPlan.priority || 0
    };

    setCategories(categories.map(cat => 
      cat.id === selectedPlanCategoryId
        ? { ...cat, plans: cat.plans.map(p => p.id === selectedPlan.id ? updatedPlan : p) }
        : cat
    ));

    setSelectedPlan(updatedPlan);
    setIsEditing(false);
  };

  // Create new Plan - prepend to Left Sidebar array so it spawns to the right of Add Balloon
  const handleCreatePlan = (e) => {
    e.preventDefault();
    if (!newPlanTitle.trim() || !activeCategoryForNewPlan) return;

    const selectedPreset = COLOR_PRESETS[newPlanColorIndex];
    const newPlan = {
      id: `plan-${Date.now()}`,
      title: newPlanTitle.trim(),
      summary: newPlanSummary.trim() || 'A new idea to capture.',
      content: newPlanContent.trim() || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec molestie, mi in placerat luctus, sapien leo elementum lacus, ac porta nibh erat a augue.',
      gradient: selectedPreset.gradient,
      glow: selectedPreset.glow,
      priority: 0 // Priority defaults to 0
    };

    setCategories(categories.map(cat => 
      cat.id === activeCategoryForNewPlan
        ? { ...cat, plans: [newPlan, ...cat.plans] }
        : cat
    ));

    setIsCreatingPlan(false);
    setActiveCategoryForNewPlan(null);
    
    // Reset Form
    setNewPlanTitle('');
    setNewPlanSummary('');
    setNewPlanContent('');
    setNewPlanColorIndex(0);
  };

  const handleDeletePlan = (planId) => {
    if (!selectedPlanCategoryId) return;
    if (window.confirm("Are you sure you want to delete this plan balloon? This action cannot be undone.")) {
      setCategories(categories.map(cat => 
        cat.id === selectedPlanCategoryId
          ? { ...cat, plans: cat.plans.filter(p => p.id !== planId) }
          : cat
      ));
      setSelectedPlan(null);
      setSelectedPlanCategoryId(null);
      setIsEditing(false);
    }
  };

  // Increment or Decrement plan balloon priority count (Min limit is 0)
  const handleUpdatePriority = (categoryId, planId, increment) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId
        ? {
            ...cat,
            plans: cat.plans.map(p => 
              p.id === planId ? { ...p, priority: Math.max(0, (p.priority || 0) + increment) } : p
            )
          }
        : cat
    ));
  };

  // Active drawer content data mapping
  const getDrawerConfig = () => {
    if (!expandedList) return null;
    const list = lists.find(l => l.id === expandedList);
    if (!list) return null;

    const IconComponent = IconMap[list.icon] || Layers;
    return {
      title: list.title,
      iconName: list.icon,
      icon: <IconComponent style={{ color: list.iconColor || list.accentColor }} size={24} />,
      items: list.items,
      accentColor: list.accentColor,
      iconColor: list.iconColor, // Solid iconColor
      key: list.id
    };
  };

  const activeDrawer = getDrawerConfig();

  // Categorized Column Lists
  const leftCategories = categories.filter(c => c.side === 'left');
  const rightCategories = categories.filter(c => c.side === 'right');

  return (
    <div className="mindspace-container">
      
      {/* LEFT SIDEBAR: Dynamic category boxes on the left, with "+ Add Category" control at top */}
      <aside 
        className="sidebar left-sidebar" 
        aria-label="Plans Left Workspace"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => draggedCategoryId && handleCategoryDropOnSidebar(e, 'left')}
      >
        
        {/* Sidebar Header Title with Category Add Button */}
        <div className="sidebar-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} style={{ color: 'var(--neon-blue)' }} /> Left Sidebar
          </span>
          <button 
            className="category-btn"
            onClick={() => {
              setNewCategorySide('left');
              setIsCreatingCategory(true);
            }}
            title="Add Category Box"
            style={{ opacity: 0.8 }}
          >
            <Plus size={14} />
          </button>
        </div>
        
        {/* Stacked Categories List */}
        {leftCategories.map(cat => {
          const isCatDragOver = dragOverCategoryId === cat.id;
          return (
            <div 
              key={cat.id} 
              className={`category-box ${draggedCategoryId === cat.id ? 'category-dragging' : ''} ${isCatDragOver ? 'category-drag-over' : ''}`}
              style={{ '--accent-color': cat.accentColor }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => draggedCategoryId && draggedCategoryId !== cat.id && setDragOverCategoryId(cat.id)}
              onDragLeave={() => setDragOverCategoryId(null)}
              onDrop={(e) => {
                if (draggedCategoryId) {
                  handleCategoryDropOnCategory(e, cat.id, 'left');
                }
              }}
            >
              {/* Category Header with Title renaming, minimize, & delete controls */}
              <div 
                className="category-header"
                draggable={editingCategoryId === null}
                onDragStart={(e) => handleCategoryDragStart(e, cat.id)}
                onDragEnd={handleCategoryDragEnd}
              >
                {editingCategoryId === cat.id ? (
                  <div className="inline-action-group" style={{ flexDirection: 'column', gap: '0.4rem', width: '100%', alignItems: 'stretch' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.25rem', width: '100%' }}>
                      <input 
                        type="text"
                        className="inline-edit-sidebar-title-input"
                        style={{ flexGrow: 1 }}
                        value={editingCategoryTitleText}
                        onChange={(e) => setEditingCategoryTitleText(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveCategoryTitle(cat.id);
                          if (e.key === 'Escape') setEditingCategoryId(null);
                        }}
                      />
                      <button 
                        type="button"
                        className="category-btn"
                        style={{ background: COLOR_PRESETS[editingCategoryColorIndex].gradient, borderColor: 'transparent', color: '#fff' }}
                        onClick={() => saveCategoryTitle(cat.id)}
                        title="Save Category Config"
                      >
                        <Check size={11} />
                      </button>
                      <button 
                        type="button"
                        className="category-btn cancel"
                        onClick={() => setEditingCategoryId(null)}
                        title="Cancel"
                      >
                        <X size={11} />
                      </button>
                    </div>
                    
                    {/* Mini Color Picker for Category Box */}
                    <div className="color-picker-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.25rem', width: '100%', padding: '2px 0' }}>
                      {COLOR_PRESETS.map((preset, idx) => (
                        <button
                          key={preset.name}
                          type="button"
                          className={`color-option ${editingCategoryColorIndex === idx ? 'selected' : ''}`}
                          style={{ background: preset.gradient, borderRadius: '4px', height: '16px', width: '16px' }}
                          onClick={() => setEditingCategoryColorIndex(idx)}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="category-title">
                    <button 
                      className="category-btn" 
                      onClick={(e) => { e.stopPropagation(); handleToggleCategoryCollapse(cat.id); }}
                      title={cat.collapsed ? "Maximize Category" : "Minimize Category"}
                      style={{ marginRight: '0.2rem', padding: '1px' }}
                    >
                      <ChevronRight size={12} style={{ transform: cat.collapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s ease' }} />
                    </button>
                    <div style={{ width: '4px', height: '12px', background: cat.accentColor, borderRadius: '2px' }} />
                    {cat.title}
                    <button 
                      className="category-btn"
                      onClick={(e) => { e.stopPropagation(); startEditingCategory(cat.id, cat.title, cat.accentColor); }}
                      title="Rename Category"
                    >
                      <Edit3 size={10} />
                    </button>
                  </div>
                )}

                {/* Action items inside category */}
                <div className="category-action-group" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="category-btn"
                    onClick={() => {
                      setActiveCategoryForNewPlan(cat.id);
                      setIsCreatingPlan(true);
                    }}
                    title="Add Balloon inside Category"
                  >
                    <Plus size={11} />
                  </button>
                  <button 
                    className="category-btn"
                    onClick={() => handleDuplicateCategory(cat.id)}
                    title="Duplicate Category"
                  >
                    <Copy size={11} />
                  </button>
                  <button 
                    className="category-btn delete"
                    onClick={() => handleDeleteCategory(cat.id)}
                    title="Delete Category"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              {/* Plans balloon grid belonging specifically to this Category (Hidden when minimized/collapsed) */}
              {!cat.collapsed && (
                <div 
                  className="plans-sidebar-grid" 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handlePlanDropOnContainer(e, cat.id)}
                >
                  {cat.plans.map((plan, idx) => {
                    const isDragOver = dragOverCard && dragOverCard.targetCategoryId === cat.id && dragOverCard.index === idx;
                    return (
                      <div
                        key={plan.id}
                        className={`plan-balloon ${isDragOver ? 'drag-over-target' : ''}`}
                        style={{
                          background: `linear-gradient(rgba(13, 20, 38, 0.9), rgba(13, 20, 38, 0.9)) padding-box, ${plan.gradient} border-box`,
                          border: '2px solid transparent',
                          '--balloon-glow': `0 10px 22px -4px ${plan.glow}`,
                          boxShadow: `0 8px 20px -5px rgba(0, 0, 0, 0.4), 0 0 1px ${plan.glow}`
                        }}
                        onClick={() => handleOpenPlan(plan, cat.id)}
                        draggable={true}
                        onDragStart={(e) => handlePlanDragStart(e, cat.id, idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={() => setDragOverCard({ targetCategoryId: cat.id, index: idx })}
                        onDragLeave={() => setDragOverCard(null)}
                        onDrop={(e) => handlePlanDropOnCard(e, cat.id, idx)}
                        onDragEnd={handlePlanDragEnd}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleOpenPlan(plan, cat.id)}
                      >
                        <div className="plan-balloon-title">{plan.title}</div>
                        <div className="plan-balloon-summary">{plan.summary}</div>
                        <div className="plan-balloon-footer">
                          {/* Priority Selector Counter */}
                          <div className="priority-control" onClick={(e) => e.stopPropagation()}>
                            <button 
                              type="button" 
                              className="priority-btn minus"
                              onClick={() => handleUpdatePriority(cat.id, plan.id, -1)}
                              title="Decrease Priority"
                            >
                              -
                            </button>
                            <span className="priority-val">
                              {plan.priority || 0}
                            </span>
                            <button 
                              type="button" 
                              className="priority-btn plus"
                              onClick={() => handleUpdatePriority(cat.id, plan.id, 1)}
                              title="Increase Priority"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {cat.plans.length === 0 && (
                    <div className="category-empty-text">
                      Drop balloons here
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {leftCategories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '20px', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.8rem' }}>
            No categories yet. Click "+" above to create one.
          </div>
        )}
      </aside>

      {/* CENTER SCREEN: Swapped Lists (Dynamic Grid) */}
      <main className="lists-center-container" aria-label="Lists Center space">
        <header className="app-header">
          <div className="app-title">MindSpace</div>
          <div className="app-subtitle">interactive dashboards • customize your focus</div>
        </header>

        <div className="center-lists-grid">
          {lists.map((list, index) => {
            const IconComponent = IconMap[list.icon] || Layers;
            const activeItems = list.items.filter(item => !item.deleted);
            return (
              <div 
                key={list.id}
                className="center-list-card glass-panel"
                style={{ 
                  '--accent-color': list.accentColor, 
                  '--icon-color': list.iconColor || list.accentColor, // Bound --icon-color CSS property
                  '--glow-effect': list.glowColor
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleItemDropOnContainer(e, list.id)}
                onMouseDown={handleCardMouseDown}
                onClick={(e) => handleCardClick(e, list.id)}
              >
                <div 
                  className="center-list-card-header"
                  draggable={editingListId === null && editingItemId === null}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Title and Icon are clean, no rename inputs or trash cans here */}
                  <span className="center-list-card-title">
                    <IconComponent size={22} style={{ color: list.iconColor || list.accentColor }} /> 
                    {list.title}
                  </span>

                  <div style={{ display: 'flex', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="reset-card-btn"
                      onClick={() => handleResetListItems(list.id)}
                      title="Reset (uncheck) all items"
                    >
                      <RotateCcw size={12} />
                    </button>
                    <button 
                      className="duplicate-card-btn"
                      onClick={() => handleDuplicateList(list.id)}
                      title="Duplicate Card"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                
                {/* Inline Description Editor */}
                <textarea
                  className="list-card-description-input"
                  value={list.description}
                  onChange={(e) => handleUpdateDescription(list.id, e.target.value)}
                  placeholder="Type a description to know what this card is about..."
                  maxLength={120}
                  aria-label={`${list.title} description`}
                />

                <div className="center-checklist-wrapper">
                  {activeItems.map((item, itemIdx) => (
                    <div 
                      key={item.id}
                      className={`checklist-item ${item.completed ? 'checked' : ''} ${draggedItem && draggedItem.itemId === item.id ? 'item-dragging' : ''} ${dragOverItem && dragOverItem.itemId === item.id ? 'item-drag-over' : ''}`}
                      onClick={() => handleToggleItem(list.id, item.id)}
                      style={{ '--accent-color': 'var(--accent-color)' }}
                      draggable={true}
                      onDragStart={(e) => handleItemDragStart(e, list.id, item.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={() => handleItemDragEnter(list.id, item.id)}
                      onDragLeave={() => setDragOverItem(null)}
                      onDrop={(e) => handleItemDropOnItem(e, list.id, item.id)}
                      onDragEnd={handleItemDragEnd}
                    >
                      <div className="checklist-item-row">
                        <div className="checklist-checkbox-wrapper">
                          <div className={`checklist-checkbox ${item.completed ? 'checked' : ''}`}>
                            {item.completed && <Check size={10} color="#fff" />}
                          </div>
                        </div>
                        <span className="checklist-item-text">{item.text}</span>
                        
                        <div className="inline-action-group" onClick={(e) => e.stopPropagation()}>
                          <button 
                            type="button"
                            className="arrow-sort-btn"
                            onClick={() => handleMoveItem(list.id, item.id, 'up')}
                            disabled={itemIdx === 0}
                            title="Move Up"
                          >
                            <ArrowUp size={11} />
                          </button>
                          <button 
                            type="button"
                            className="arrow-sort-btn"
                            onClick={() => handleMoveItem(list.id, item.id, 'down')}
                            disabled={itemIdx === activeItems.length - 1}
                            title="Move Down"
                          >
                            <ArrowDown size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {activeItems.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      No items left
                    </div>
                  )}
                </div>

                {/* Direct Add Form */}
                <form onSubmit={(e) => handleAddItemDirect(e, list.id)} className="center-list-add-form" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="text" 
                    placeholder="Add item..." 
                    className="center-list-input"
                    value={inputs[list.id] || ''}
                    onChange={(e) => setInputs({ ...inputs, [list.id]: e.target.value })}
                  />
                  <button type="submit" className="center-add-btn">
                    Add
                  </button>
                </form>
              </div>
            );
          })}

          {/* CREATE NEW LIST CARD */}
          <div 
            id="btn-create-list"
            className="create-list-card"
            onClick={() => setIsCreatingList(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsCreatingList(true)}
          >
            <div className="create-list-icon">
              <Plus size={24} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Create New List</span>
          </div>

        </div>
      </main>

      {/* RIGHT SIDEBAR: Dynamic category boxes on the right, with "+ Add Category" control at top */}
      <aside 
        className="sidebar right-sidebar" 
        aria-label="Plans Right Workspace"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => draggedCategoryId && handleCategoryDropOnSidebar(e, 'right')}
      >
        
        {/* Sidebar Header Title with Category Add Button */}
        <div className="sidebar-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} style={{ color: 'var(--neon-pink)' }} /> Right Sidebar
          </span>
          <button 
            className="category-btn"
            onClick={() => {
              setNewCategorySide('right');
              setIsCreatingCategory(true);
            }}
            title="Add Category Box"
            style={{ opacity: 0.8 }}
          >
            <Plus size={14} />
          </button>
        </div>
        
        {/* Stacked Categories List */}
        {rightCategories.map(cat => {
          const isCatDragOver = dragOverCategoryId === cat.id;
          return (
            <div 
              key={cat.id} 
              className={`category-box ${draggedCategoryId === cat.id ? 'category-dragging' : ''} ${isCatDragOver ? 'category-drag-over' : ''}`}
              style={{ '--accent-color': cat.accentColor }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => draggedCategoryId && draggedCategoryId !== cat.id && setDragOverCategoryId(cat.id)}
              onDragLeave={() => setDragOverCategoryId(null)}
              onDrop={(e) => {
                if (draggedCategoryId) {
                  handleCategoryDropOnCategory(e, cat.id, 'right');
                }
              }}
            >
              {/* Category Header with Title renaming, minimize, & delete controls */}
              <div 
                className="category-header"
                draggable={editingCategoryId === null}
                onDragStart={(e) => handleCategoryDragStart(e, cat.id)}
                onDragEnd={handleCategoryDragEnd}
              >
                {editingCategoryId === cat.id ? (
                  <div className="inline-action-group" style={{ flexDirection: 'column', gap: '0.4rem', width: '100%', alignItems: 'stretch' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.25rem', width: '100%' }}>
                      <input 
                        type="text"
                        className="inline-edit-sidebar-title-input"
                        style={{ flexGrow: 1 }}
                        value={editingCategoryTitleText}
                        onChange={(e) => setEditingCategoryTitleText(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveCategoryTitle(cat.id);
                          if (e.key === 'Escape') setEditingCategoryId(null);
                        }}
                      />
                      <button 
                        type="button"
                        className="category-btn"
                        style={{ background: COLOR_PRESETS[editingCategoryColorIndex].gradient, borderColor: 'transparent', color: '#fff' }}
                        onClick={() => saveCategoryTitle(cat.id)}
                        title="Save Category Config"
                      >
                        <Check size={11} />
                      </button>
                      <button 
                        type="button"
                        className="category-btn cancel"
                        onClick={() => setEditingCategoryId(null)}
                        title="Cancel"
                      >
                        <X size={11} />
                      </button>
                    </div>
                    
                    {/* Mini Color Picker for Category Box */}
                    <div className="color-picker-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.25rem', width: '100%', padding: '2px 0' }}>
                      {COLOR_PRESETS.map((preset, idx) => (
                        <button
                          key={preset.name}
                          type="button"
                          className={`color-option ${editingCategoryColorIndex === idx ? 'selected' : ''}`}
                          style={{ background: preset.gradient, borderRadius: '4px', height: '16px', width: '16px' }}
                          onClick={() => setEditingCategoryColorIndex(idx)}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="category-title">
                    <button 
                      className="category-btn" 
                      onClick={(e) => { e.stopPropagation(); handleToggleCategoryCollapse(cat.id); }}
                      title={cat.collapsed ? "Maximize Category" : "Minimize Category"}
                      style={{ marginRight: '0.2rem', padding: '1px' }}
                    >
                      <ChevronRight size={12} style={{ transform: cat.collapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s ease' }} />
                    </button>
                    <div style={{ width: '4px', height: '12px', background: cat.accentColor, borderRadius: '2px' }} />
                    {cat.title}
                    <button 
                      className="category-btn"
                      onClick={(e) => { e.stopPropagation(); startEditingCategory(cat.id, cat.title, cat.accentColor); }}
                      title="Rename Category"
                    >
                      <Edit3 size={10} />
                    </button>
                  </div>
                )}

                {/* Action items inside category */}
                <div className="category-action-group" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="category-btn"
                    onClick={() => {
                      setActiveCategoryForNewPlan(cat.id);
                      setIsCreatingPlan(true);
                    }}
                    title="Add Balloon inside Category"
                  >
                    <Plus size={11} />
                  </button>
                  <button 
                    className="category-btn"
                    onClick={() => handleDuplicateCategory(cat.id)}
                    title="Duplicate Category"
                  >
                    <Copy size={11} />
                  </button>
                  <button 
                    className="category-btn delete"
                    onClick={() => handleDeleteCategory(cat.id)}
                    title="Delete Category"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              {/* Plans balloon grid belonging specifically to this Category (Hidden when minimized/collapsed) */}
              {!cat.collapsed && (
                <div 
                  className="plans-sidebar-grid"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handlePlanDropOnContainer(e, cat.id)}
                >
                  {cat.plans.map((plan, idx) => {
                    const isDragOver = dragOverCard && dragOverCard.targetCategoryId === cat.id && dragOverCard.index === idx;
                    return (
                      <div
                        key={plan.id}
                        className={`plan-balloon ${isDragOver ? 'drag-over-target' : ''}`}
                        style={{
                          background: `linear-gradient(rgba(13, 20, 38, 0.9), rgba(13, 20, 38, 0.9)) padding-box, ${plan.gradient} border-box`,
                          border: '2px solid transparent',
                          '--balloon-glow': `0 10px 22px -4px ${plan.glow}`,
                          boxShadow: `0 8px 20px -5px rgba(0, 0, 0, 0.4), 0 0 1px ${plan.glow}`
                        }}
                        onClick={() => handleOpenPlan(plan, cat.id)}
                        draggable={true}
                        onDragStart={(e) => handlePlanDragStart(e, cat.id, idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={() => setDragOverCard({ targetCategoryId: cat.id, index: idx })}
                        onDragLeave={() => setDragOverCard(null)}
                        onDrop={(e) => handlePlanDropOnCard(e, cat.id, idx)}
                        onDragEnd={handlePlanDragEnd}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleOpenPlan(plan, cat.id)}
                      >
                        <div className="plan-balloon-title">{plan.title}</div>
                        <div className="plan-balloon-summary">{plan.summary}</div>
                        <div className="plan-balloon-footer">
                          {/* Priority Selector Counter */}
                          <div className="priority-control" onClick={(e) => e.stopPropagation()}>
                            <button 
                              type="button" 
                              className="priority-btn minus"
                              onClick={() => handleUpdatePriority(cat.id, plan.id, -1)}
                              title="Decrease Priority"
                            >
                              -
                            </button>
                            <span className="priority-val">
                              {plan.priority || 0}
                            </span>
                            <button 
                              type="button" 
                              className="priority-btn plus"
                              onClick={() => handleUpdatePriority(cat.id, plan.id, 1)}
                              title="Increase Priority"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {cat.plans.length === 0 && (
                    <div className="category-empty-text">
                      Drop balloons here
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {rightCategories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '20px', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.8rem' }}>
            No categories yet. Click "+" above to create one.
          </div>
        )}
      </aside>

      {/* SLIDER DRAWER: Detailed full list manager with edit & delete capabilities */}
      {activeDrawer && (
        <>
          <div className="drawer-backdrop" onClick={() => setExpandedList(null)} />
          <div 
            className={`drawer glass-panel ${expandedList === 'others' ? 'right' : 'left'}`}
            style={{ 
              borderLeft: expandedList !== 'others' ? `4px solid ${activeDrawer.accentColor}` : '1px solid var(--glass-border)',
              borderRight: expandedList === 'others' ? `4px solid ${activeDrawer.accentColor}` : '1px solid var(--glass-border)',
              '--accent-color': activeDrawer.accentColor,
              '--icon-color': activeDrawer.iconColor || activeDrawer.accentColor // Bound --icon-color CSS property inside drawer
            }}
          >
            <div className="drawer-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <h2 className="drawer-title">
                  {activeDrawer.icon}
                  {activeDrawer.title}
                  <button 
                    className="close-btn" 
                    style={{ width: '30px', height: '30px', flexShrink: 0 }}
                    onClick={() => startEditingTitle(activeDrawer.key, activeDrawer.title, activeDrawer.iconName, activeDrawer.accentColor)}
                    title="Edit Card Styling & Title"
                  >
                    <Edit3 size={13} />
                  </button>
                </h2>

                {/* Close Button only in drawer header */}
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                  <button 
                    className="reset-drawer-btn" 
                    onClick={() => handleResetListItems(activeDrawer.key)}
                    title="Reset (uncheck) all items"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button 
                    className="close-btn" 
                    onClick={() => setExpandedList(null)}
                    aria-label="Close panel"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Calculated Total Price below the card title */}
              <div className="drawer-total-price">
                <span>Unchecked Total:</span>
                <span className="total-val">
                  ${getActiveItemsTotal(activeDrawer).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checklist Items list with Edit Pencil and Trash can */}
            <div 
              className="drawer-checklist-container"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleItemDropOnContainer(e, activeDrawer.key)}
            >
              {editingListId === activeDrawer.key && (
                <div style={{ width: '100%', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', border: `1px solid ${COLOR_PRESETS[editingListColorIndex].color}33`, display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1rem' }} onClick={(e) => e.stopPropagation()}>
                  <div className="edit-form-group" style={{ marginBottom: 0 }}>
                    <label className="edit-form-label" style={{ fontSize: '0.7rem' }}>List Title</label>
                    <input 
                      type="text" 
                      className="edit-form-input" 
                      style={{ 
                        padding: '0.5rem 0.75rem', 
                        fontSize: '0.85rem',
                        '--focus-color': COLOR_PRESETS[editingListColorIndex].color,
                        '--focus-glow': `0 0 10px ${COLOR_PRESETS[editingListColorIndex].glow || 'rgba(168,85,247,0.25)'}`
                      }}
                      value={editingListTitleText}
                      onChange={(e) => setEditingListTitleText(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="edit-form-group" style={{ marginBottom: 0 }}>
                    <label className="edit-form-label" style={{ fontSize: '0.7rem' }}>Choose Icon</label>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      {Object.keys(IconMap).map((iconName) => {
                        const TempIcon = IconMap[iconName];
                        return (
                          <button
                            key={iconName}
                            type="button"
                            className={`secondary-btn ${editingListIconName === iconName ? 'active-icon-choice' : ''}`}
                            style={{ 
                              padding: '0.3rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              width: '30px', 
                              height: '30px',
                              borderRadius: '6px',
                              '--active-color': COLOR_PRESETS[editingListColorIndex].color,
                              '--active-bg': `${COLOR_PRESETS[editingListColorIndex].color}22`,
                              '--active-text': '#fff'
                            }}
                            onClick={() => setEditingListIconName(iconName)}
                            title={iconName}
                          >
                            <TempIcon size={14} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="edit-form-group" style={{ marginBottom: 0 }}>
                    <label className="edit-form-label" style={{ fontSize: '0.7rem' }}>Accent Color Theme</label>
                    <div className="color-picker-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.35rem', marginTop: '0.25rem' }}>
                      {COLOR_PRESETS.map((preset, idx) => (
                        <button
                          key={preset.name}
                          type="button"
                          className={`color-option ${editingListColorIndex === idx ? 'selected' : ''}`}
                          style={{ background: preset.gradient, borderRadius: '6px', height: '24px' }}
                          onClick={() => setEditingListColorIndex(idx)}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button 
                      type="button" 
                      className="secondary-btn" 
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', borderRadius: '8px' }}
                      onClick={cancelEditingTitle}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="center-add-btn"
                      style={{ background: COLOR_PRESETS[editingListColorIndex].gradient, padding: '0 0.85rem', fontSize: '0.75rem', borderRadius: '8px' }}
                      onClick={() => saveListConfig(activeDrawer.key)}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
              {activeDrawer.items.filter(item => !item.deleted).map((item) => (
                <div 
                  key={item.id}
                  className={`checklist-item ${item.completed && editingItemId !== item.id ? 'checked' : ''} ${draggedItem && draggedItem.itemId === item.id ? 'item-dragging' : ''} ${dragOverItem && dragOverItem.itemId === item.id ? 'item-drag-over' : ''}`}
                  onClick={() => editingItemId !== item.id && handleToggleItem(activeDrawer.key, item.id)}
                  style={{ '--accent-color': 'var(--accent-color)' }}
                  draggable={editingItemId !== item.id}
                  onDragStart={(e) => handleItemDragStart(e, activeDrawer.key, item.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => handleItemDragEnter(activeDrawer.key, item.id)}
                  onDragLeave={() => setDragOverItem(null)}
                  onDrop={(e) => handleItemDropOnItem(e, activeDrawer.key, item.id)}
                  onDragEnd={handleItemDragEnd}
                >
                  {editingItemId === item.id ? (
                    <div className="inline-action-group" style={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="text" 
                        className="inline-edit-item-input" 
                        value={editingItemText}
                        onChange={(e) => setEditingItemText(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveChecklistItem(activeDrawer.key, item.id);
                          if (e.key === 'Escape') cancelEditingItem();
                        }}
                      />
                      <button 
                        type="button" 
                        className="inline-action-btn" 
                        onClick={() => saveChecklistItem(activeDrawer.key, item.id)}
                        title="Save Item"
                      >
                        <Check size={12} />
                      </button>
                      <button 
                        type="button" 
                        className="inline-action-btn cancel" 
                        onClick={cancelEditingItem}
                        title="Cancel"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="checklist-item-row">
                        <div className="checklist-checkbox-wrapper">
                          <div className={`checklist-checkbox ${item.completed ? 'checked' : ''}`}>
                            {item.completed && <Check size={10} color="#fff" />}
                          </div>
                        </div>
                        <span className="checklist-item-text">{item.text}</span>
                        <div className="inline-action-group" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="delete-item-btn"
                            style={{ opacity: 1, padding: '2px 4px', display: 'inline-flex' }}
                            onClick={() => startEditingItem(item.id, item.text)}
                            title="Rename Item"
                          >
                            <Edit3 size={11} />
                          </button>
                          <button 
                            className="delete-item-btn"
                            style={{ opacity: 1, padding: '2px 4px', display: 'inline-flex' }}
                            onClick={() => handleDeleteItem(activeDrawer.key, item.id)}
                            aria-label="Delete item"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      {!item.deleted && (
                        <div className="checklist-item-price-row" onClick={(e) => e.stopPropagation()}>
                          <span className="price-label">Price: $</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            placeholder="0.00"
                            className="price-input" 
                            disabled={item.completed}
                            value={item.price || ''} 
                            onChange={(e) => handleUpdateItemPrice(activeDrawer.key, item.id, e.target.value)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              {activeDrawer.items.filter(item => !item.deleted).length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                  <Sparkles size={28} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>No active items yet.</p>
                </div>
              )}

              {/* Collapsible Trash Bin Section */}
              {(() => {
                const hiddenItems = activeDrawer.items.filter(item => item.deleted);
                if (hiddenItems.length === 0) return null;
                return (
                  <div style={{ marginTop: '2rem', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                    <button 
                      type="button"
                      className="sidebar-title"
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', width: '100%', justifyContent: 'space-between', padding: 0, textTransform: 'uppercase' }}
                      onClick={() => setIsTrashBinOpen(!isTrashBinOpen)}
                    >
                      <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Trash2 size={12} style={{ color: 'var(--neon-pink)' }} /> Trash Bin ({hiddenItems.length})
                      </span>
                      <ChevronRight size={12} style={{ transform: isTrashBinOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: 'var(--text-secondary)' }} />
                    </button>
                    
                    {isTrashBinOpen && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                        {hiddenItems.map(item => (
                          <div key={item.id} className="checklist-item" style={{ opacity: 0.6, cursor: 'default' }}>
                            <div className="checklist-item-row">
                              <span className="checklist-item-text" style={{ fontStyle: 'italic', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>{item.text}</span>
                              <div className="inline-action-group" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="delete-item-btn"
                                  style={{ opacity: 1, color: 'var(--neon-green)', display: 'inline-flex', padding: '2px 4px' }}
                                  onClick={() => handleRestoreItem(activeDrawer.key, item.id)}
                                  title="Restore Item"
                                >
                                  <RotateCcw size={11} />
                                </button>
                                <button
                                  type="button"
                                  className="delete-item-btn"
                                  style={{ opacity: 1, color: 'var(--neon-pink)', display: 'inline-flex', padding: '2px 4px' }}
                                  onClick={() => handleDeleteItem(activeDrawer.key, item.id)}
                                  title="Permanently Delete"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Checklist Add Form and Left-Bottom Delete Icon Button */}
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
              <button 
                type="button"
                className="danger-btn"
                style={{ padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', flexShrink: 0, borderRadius: '10px' }}
                onClick={() => handleDeleteList(activeDrawer.key)}
                title="Delete List Card"
              >
                <Trash2 size={15} />
              </button>
              
              <button 
                type="button"
                className="secondary-btn"
                style={{ padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', flexShrink: 0, borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={() => {
                  handleDuplicateList(activeDrawer.key);
                  setExpandedList(null);
                }}
                title="Duplicate List Card"
              >
                <Copy size={15} />
              </button>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddItem(activeDrawer.key, drawerInputText);
                  setDrawerInputText('');
                }} 
                style={{ flexGrow: 1, display: 'flex', gap: '0.4rem' }}
              >
                <input 
                  type="text" 
                  placeholder="Add generic item..." 
                  className="center-list-input"
                  value={drawerInputText}
                  onChange={(e) => setDrawerInputText(e.target.value)}
                  autoFocus
                />
                <button 
                  type="submit" 
                  className="center-add-btn"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* PLAN DETAILS MODAL */}
      {selectedPlan && (
        <div className="modal-backdrop" onClick={() => { setSelectedPlan(null); setSelectedPlanCategoryId(null); }}>
          <div 
            className="modal-content glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              border: `2px solid transparent`,
              background: `linear-gradient(rgba(13, 20, 38, 0.95), rgba(13, 20, 38, 0.95)) padding-box, ${isEditing ? COLOR_PRESETS[editPlanColorIndex].gradient : selectedPlan.gradient} border-box`
            }}
          >
            {isEditing ? (
              <form onSubmit={handleSavePlanEdit}>
                {/* Absolute Top-Right Close Button */}
                <button 
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsEditing(false)}
                  aria-label="Cancel editing"
                >
                  <X size={16} />
                </button>

                <div className="drawer-header" style={{ marginBottom: '1.5rem', paddingRight: '2rem' }}>
                  <h2 className="drawer-title" style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span 
                      style={{ 
                        background: COLOR_PRESETS[editPlanColorIndex].gradient, 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '0.85rem', 
                        fontWeight: '800', 
                        color: '#fff', 
                        boxShadow: `0 0 10px ${COLOR_PRESETS[editPlanColorIndex].glow || 'rgba(255,255,255,0.2)'}`,
                        flexShrink: 0
                      }}
                    >
                      {selectedPlan.priority || 0}
                    </span>
                    Edit Balloon Details
                  </h2>
                </div>

                <div className="edit-form-group">
                  <label className="edit-form-label">Plan Title</label>
                  <input 
                    type="text" 
                    className="edit-form-input" 
                    style={{ 
                      '--focus-color': COLOR_PRESETS[editPlanColorIndex].color,
                      '--focus-glow': `0 0 10px ${COLOR_PRESETS[editPlanColorIndex].glow || 'rgba(168,85,247,0.25)'}`
                    }}
                    value={editPlanTitle}
                    onChange={(e) => setEditPlanTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="edit-form-group">
                  <label className="edit-form-label">Brief Summary</label>
                  <input 
                    type="text" 
                    className="edit-form-input" 
                    style={{ 
                      '--focus-color': COLOR_PRESETS[editPlanColorIndex].color,
                      '--focus-glow': `0 0 10px ${COLOR_PRESETS[editPlanColorIndex].glow || 'rgba(168,85,247,0.25)'}`
                    }}
                    value={editPlanSummary}
                    onChange={(e) => setEditPlanSummary(e.target.value)}
                    placeholder="Short summary displayed on balloon"
                  />
                </div>

                <div className="edit-form-group">
                  <label className="edit-form-label">Detailed Content</label>
                  <textarea 
                    className="edit-form-input edit-form-textarea" 
                    style={{ 
                      '--focus-color': COLOR_PRESETS[editPlanColorIndex].color,
                      '--focus-glow': `0 0 10px ${COLOR_PRESETS[editPlanColorIndex].glow || 'rgba(168,85,247,0.25)'}`
                    }}
                    value={editPlanContent}
                    onChange={(e) => setEditPlanContent(e.target.value)}
                    placeholder="Provide details..."
                  />
                </div>

                <div className="edit-form-group">
                  <label className="edit-form-label">Balloon Color Theme</label>
                  <div className="color-picker-grid">
                    {COLOR_PRESETS.map((preset, idx) => (
                      <button
                        key={preset.name}
                        type="button"
                        className={`color-option ${editPlanColorIndex === idx ? 'selected' : ''}`}
                        style={{ background: preset.gradient }}
                        onClick={() => setEditPlanColorIndex(idx)}
                        title={preset.name}
                        aria-label={`Select ${preset.name} color`}
                      />
                    ))}
                  </div>
                </div>

                <div className="modal-divider" />

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="danger-btn" 
                    style={{ padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', flexShrink: 0 }}
                    onClick={() => handleDeletePlan(selectedPlan.id)}
                    title="Delete Balloon"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div style={{ flexGrow: 1 }} />
                  <button 
                    type="button" 
                    className="secondary-btn" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="center-add-btn"
                    style={{ background: COLOR_PRESETS[editPlanColorIndex].gradient, padding: '0 1.25rem' }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {/* Absolute Top-Right Close Button */}
                <button 
                  className="modal-close-btn" 
                  onClick={() => { setSelectedPlan(null); setSelectedPlanCategoryId(null); }}
                  aria-label="Close plan"
                >
                  <X size={16} />
                </button>
                <h2 className="modal-title" style={{ paddingRight: '2rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span 
                    style={{ 
                      background: selectedPlan.gradient, 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.85rem', 
                      fontWeight: '800', 
                      color: '#fff', 
                      boxShadow: `0 0 10px ${selectedPlan.glow || 'rgba(255,255,255,0.2)'}`,
                      flexShrink: 0
                    }}
                  >
                    {selectedPlan.priority || 0}
                  </span>
                  {selectedPlan.title}
                 </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {selectedPlan.summary}
                </p>

                <div className="modal-divider" />

                <div className="modal-body" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  <p>{selectedPlan.content}</p>
                </div>

                <div className="modal-divider" />

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="danger-btn" 
                    style={{ padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', flexShrink: 0 }}
                    onClick={() => handleDeletePlan(selectedPlan.id)}
                    title="Delete Balloon"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div style={{ flexGrow: 1 }} />
                  <button 
                    type="button"
                    className="secondary-btn" 
                    onClick={() => handleDuplicatePlan(selectedPlan.id, selectedPlanCategoryId)}
                  >
                    Duplicate Idea
                  </button>
                  <button 
                    className="secondary-btn" 
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Idea
                  </button>
                  <button 
                    className="center-add-btn" 
                    style={{ background: selectedPlan.gradient, padding: '0 1.25rem' }}
                    onClick={() => { setSelectedPlan(null); setSelectedPlanCategoryId(null); }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW PLAN MODAL */}
      {isCreatingPlan && (
        <div className="modal-backdrop" onClick={() => { setIsCreatingPlan(false); setActiveCategoryForNewPlan(null); }}>
          <div 
            className="modal-content glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              border: `2px solid transparent`,
              background: `linear-gradient(rgba(13, 20, 38, 0.95), rgba(13, 20, 38, 0.95)) padding-box, ${COLOR_PRESETS[newPlanColorIndex].gradient} border-box`
            }}
          >
            <form onSubmit={handleCreatePlan}>
              {/* Absolute Top-Right Close Button */}
              <button 
                type="button"
                className="modal-close-btn"
                onClick={() => { setIsCreatingPlan(false); setActiveCategoryForNewPlan(null); }}
                aria-label="Close panel"
              >
                <X size={16} />
              </button>

              <div className="drawer-header" style={{ marginBottom: '1.5rem', paddingRight: '2rem' }}>
                <h2 className="drawer-title" style={{ fontSize: '1.3rem' }}>
                  <Sparkles size={20} style={{ color: 'var(--neon-purple)' }} /> Create a Floating Idea
                </h2>
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Idea Title</label>
                <input 
                  type="text" 
                  className="edit-form-input" 
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  placeholder="e.g. Creative Philosophy"
                  required
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Brief Summary</label>
                <input 
                  type="text" 
                  className="edit-form-input" 
                  value={newPlanSummary}
                  onChange={(e) => setNewPlanSummary(e.target.value)}
                  placeholder="Short description displayed on balloon"
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Detailed Content</label>
                <textarea 
                  className="edit-form-input edit-form-textarea" 
                  value={newPlanContent}
                  onChange={(e) => setNewPlanContent(e.target.value)}
                  placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit. If left blank, generic lorem content is filled."
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Balloon Color Theme</label>
                <div className="color-picker-grid">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      className={`color-option ${newPlanColorIndex === idx ? 'selected' : ''}`}
                      style={{ background: preset.gradient }}
                      onClick={() => setNewPlanColorIndex(idx)}
                      title={preset.name}
                      aria-label={`Select ${preset.name} color`}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-divider" />

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="secondary-btn" 
                  onClick={() => { setIsCreatingPlan(false); setActiveCategoryForNewPlan(null); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="center-add-btn"
                  style={{ background: COLOR_PRESETS[newPlanColorIndex].gradient, padding: '0 1.25rem' }}
                >
                  Launch Balloon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW LIST CARD MODAL */}
      {isCreatingList && (
        <div className="modal-backdrop" onClick={() => setIsCreatingList(false)}>
          <div 
            className="modal-content glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              border: `2px solid transparent`,
              background: `linear-gradient(rgba(13, 20, 38, 0.95), rgba(13, 20, 38, 0.95)) padding-box, ${COLOR_PRESETS[newListColorIndex].gradient} border-box`
            }}
          >
            <form onSubmit={handleCreateList}>
              {/* Absolute Top-Right Close Button */}
              <button 
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCreatingList(false)}
                aria-label="Close panel"
              >
                <X size={16} />
              </button>

              <div className="drawer-header" style={{ marginBottom: '1.5rem', paddingRight: '2rem' }}>
                <h2 className="drawer-title" style={{ fontSize: '1.3rem' }}>
                  <Plus size={20} style={{ color: 'var(--neon-purple)' }} /> Create a Center List
                </h2>
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">List Title</label>
                <input 
                  type="text" 
                  className="edit-form-input" 
                  style={{ 
                    '--focus-color': COLOR_PRESETS[newListColorIndex].color,
                    '--focus-glow': `0 0 10px ${COLOR_PRESETS[newListColorIndex].glow || 'rgba(168,85,247,0.25)'}`
                  }}
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="e.g. Work Tasks or Shopping"
                  required
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Initial Description</label>
                <input 
                  type="text" 
                  className="edit-form-input" 
                  style={{ 
                    '--focus-color': COLOR_PRESETS[newListColorIndex].color,
                    '--focus-glow': `0 0 10px ${COLOR_PRESETS[newListColorIndex].glow || 'rgba(168,85,247,0.25)'}`
                  }}
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  placeholder="Type a description to know what this card is about..."
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Choose Icon</label>
                <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {Object.keys(IconMap).map((iconName) => {
                    const TempIcon = IconMap[iconName];
                    return (
                      <button
                        key={iconName}
                        type="button"
                        className={`secondary-btn ${newListIconName === iconName ? 'active-icon-choice' : ''}`}
                        style={{ 
                          padding: '0.5rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: '40px', 
                          height: '40px',
                          '--active-color': COLOR_PRESETS[newListColorIndex].color,
                          '--active-bg': `${COLOR_PRESETS[newListColorIndex].color}22`,
                          '--active-text': '#fff'
                        }}
                        onClick={() => setNewListIconName(iconName)}
                        title={iconName}
                        aria-label={`Select ${iconName} icon`}
                      >
                        <TempIcon size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Accent Color Theme</label>
                <div className="color-picker-grid">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      className={`color-option ${newListColorIndex === idx ? 'selected' : ''}`}
                      style={{ background: preset.gradient }}
                      onClick={() => setNewListColorIndex(idx)}
                      title={preset.name}
                      aria-label={`Select ${preset.name} color`}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-divider" />

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="secondary-btn" 
                  onClick={() => setIsCreatingList(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="center-add-btn"
                  style={{ background: COLOR_PRESETS[newListColorIndex].gradient, padding: '0 1.25rem' }}
                >
                  Create Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW CATEGORY MODAL */}
      {isCreatingCategory && (
        <div className="modal-backdrop" onClick={() => setIsCreatingCategory(false)}>
          <div 
            className="modal-content glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              border: `2px solid transparent`,
              background: `linear-gradient(rgba(13, 20, 38, 0.95), rgba(13, 20, 38, 0.95)) padding-box, ${COLOR_PRESETS[newCategoryColorIndex].gradient} border-box`
            }}
          >
            <form onSubmit={handleCreateCategory}>
              <button 
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCreatingCategory(false)}
                aria-label="Close panel"
              >
                <X size={16} />
              </button>

              <div className="drawer-header" style={{ marginBottom: '1.5rem', paddingRight: '2rem' }}>
                <h2 className="drawer-title" style={{ fontSize: '1.3rem' }}>
                  <Sparkles size={20} style={{ color: 'var(--neon-purple)' }} /> Create Plan Category
                </h2>
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Category Title</label>
                <input 
                  type="text" 
                  className="edit-form-input" 
                  style={{ 
                    '--focus-color': COLOR_PRESETS[newCategoryColorIndex].color,
                    '--focus-glow': `0 0 10px ${COLOR_PRESETS[newCategoryColorIndex].glow || 'rgba(168,85,247,0.25)'}`
                  }}
                  value={newCategoryTitle}
                  onChange={(e) => setNewCategoryTitle(e.target.value)}
                  placeholder="e.g. Work Plans or Hobby Goals"
                  required
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Target Sidebar Column</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    style={{ 
                      flex: 1, 
                      padding: '0.6rem',
                      border: newCategorySide === 'left' ? `2px solid ${COLOR_PRESETS[newCategoryColorIndex].color}` : '1px solid rgba(255,255,255,0.08)',
                      background: newCategorySide === 'left' ? `${COLOR_PRESETS[newCategoryColorIndex].color}22` : 'rgba(255,255,255,0.02)',
                      color: newCategorySide === 'left' ? COLOR_PRESETS[newCategoryColorIndex].color : 'var(--text-secondary)',
                      fontWeight: newCategorySide === 'left' ? '700' : '500'
                    }}
                    onClick={() => setNewCategorySide('left')}
                  >
                    Left Sidebar
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    style={{ 
                      flex: 1, 
                      padding: '0.6rem',
                      border: newCategorySide === 'right' ? `2px solid ${COLOR_PRESETS[newCategoryColorIndex].color}` : '1px solid rgba(255,255,255,0.08)',
                      background: newCategorySide === 'right' ? `${COLOR_PRESETS[newCategoryColorIndex].color}22` : 'rgba(255,255,255,0.02)',
                      color: newCategorySide === 'right' ? COLOR_PRESETS[newCategoryColorIndex].color : 'var(--text-secondary)',
                      fontWeight: newCategorySide === 'right' ? '700' : '500'
                    }}
                    onClick={() => setNewCategorySide('right')}
                  >
                    Right Sidebar
                  </button>
                </div>
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Accent Color Theme</label>
                <div className="color-picker-grid">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      className={`color-option ${newCategoryColorIndex === idx ? 'selected' : ''}`}
                      style={{ background: preset.gradient }}
                      onClick={() => setNewCategoryColorIndex(idx)}
                      title={preset.name}
                      aria-label={`Select ${preset.name} color`}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-divider" />

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="secondary-btn" 
                  onClick={() => setIsCreatingCategory(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="center-add-btn"
                  style={{ background: COLOR_PRESETS[newCategoryColorIndex].gradient, padding: '0 1.25rem' }}
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
