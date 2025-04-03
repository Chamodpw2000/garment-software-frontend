import React, { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const HomePage = () => {
  // State for input values
  const [sizes, setSizes] = useState([
    { name: 'Small', quantity: 500 },
    { name: 'Medium', quantity: 200 },
    { name: 'Large', quantity: 300 },
    { name: 'XL', quantity: 150 }
  ]);

  const [maxBlocksPerCut, setMaxBlocksPerCut] = useState(0);
  const [maxStackingCloth, setMaxStackingCloth] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('input');

  // Add a new size row
  const addSize = () => {
    setSizes([...sizes, { name: '', quantity: 0 }]);
  };

  // Remove a size row
  const removeSize = (index) => {
    const newSizes = [...sizes];
    newSizes.splice(index, 1);
    setSizes(newSizes);
  };

  // Update size name
  const updateSizeName = (index, name) => {
    const newSizes = [...sizes];
    newSizes[index].name = name;
    setSizes(newSizes);
  };

  // Update size quantity
  const updateSizeQuantity = (index, quantity) => {
    const newSizes = [...sizes];
    newSizes[index].quantity = parseInt(quantity) || 0;
    setSizes(newSizes);
  };

  // Convert sizes array to object format required by the optimizer function
  const getSizesObject = () => {
    const sizesObject = {};
    sizes.forEach(size => {
      if (size.name.trim() && size.quantity > 0) {
        sizesObject[size.name.trim()] = size.quantity;
      }
    });
    return sizesObject;
  };

  const checkForErrors = () => {
    if (sizes.length === 0) {
      toast.error("Please add at least one size order.");
      return true;
    }
    if (!maxBlocksPerCut || maxBlocksPerCut <= 0) {
      toast.error("Please enter a valid maximum blocks per cut.");
      return true;
    }
    if (!maxStackingCloth || maxStackingCloth <= 0) {
      toast.error("Please enter a valid maximum stacking cloth.");
      return true;
    }

    return false;
  }

  const optimizeCutting = () => {
    if (checkForErrors()) {
      return; // Stop execution if there are errors
    }
  
    setLoading(true);
    const orders = getSizesObject();
    const formData = {
      orders,
      maxBlocksPerCut,
      maxStackingCloth,
    };

    console.log('Form data:', formData);
    
  
    axios.post('http://localhost:3000/api/orders/optimize-cutting', formData)
      .then((response) => {
        console.log('Optimization response:', response.data);
        // Process the data to include remaining counts (which the backend doesn't provide)
        const data = response.data;
        
        // Calculate remaining counts after each cut
        if (data.cuttingPlan && data.cuttingPlan.length > 0) {
          // Initialize remaining counts with original orders
          let remaining = { ...orders };
          
          // Process each cut and calculate the remaining after it
          data.cuttingPlan.forEach(cut => {
            // Add remainingAfterCut property to each cut
            cut.remainingAfterCut = { ...remaining };
            
            // Update the remaining counts after processing this cut
            Object.entries(cut.blocks).forEach(([size, count]) => {
              if (remaining[size]) {
                // Subtract the cut amount accounting for stack size
                remaining[size] -= count * cut.stackSize;
                
                // Ensure we don't go below zero
                if (remaining[size] < 0) remaining[size] = 0;
              }
            });
          });
        }
        
        setResult(data);
        setActiveTab('results');
      })
      .catch((error) => {
        toast.error(error.message || "Failed to optimize cutting plan");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 flex items-center justify-center">
      <div className="max-w-5xl mx-auto bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('input')}
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'input'
                ? 'border-b-2 border-blue-400 text-blue-500'
                : 'text-gray-500 hover:text-gray-600'
                }`}
            >
              Input Parameters
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'results'
                ? 'border-b-2 border-blue-400 text-blue-500'
                : 'text-gray-500 hover:text-gray-600'
                }`}
              disabled={!result}
            >
              Optimization Results
            </button>
          </nav>
        </div>

        {activeTab === 'input' ? (
          <div className="p-4">
            <h1 className="text-xl font-semibold text-gray-800 mb-4">Garment Cutting Optimizer</h1>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-md font-medium text-gray-700">Size Orders</h2>
                <button
                  onClick={addSize}
                  className="py-1 px-3 text-xs border border-gray-200 rounded-md shadow-sm font-medium text-blue-500 bg-blue-50 hover:bg-blue-100 focus:outline-none"
                >
                  Add Size
                </button>
              </div>

              <div className="overflow-x-auto bg-gray-50 rounded-md">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-3 py-2 bg-gray-100 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {sizes.map((size, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="text"
                            value={size.name}
                            onChange={(e) => updateSizeName(index, e.target.value)}
                            className="border border-gray-200 p-1 w-full rounded text-sm"
                            placeholder="Size name"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            value={size.quantity}
                            onChange={(e) => updateSizeQuantity(index, e.target.value)}
                            className="border border-gray-200 p-1 w-full rounded text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <button
                            onClick={() => removeSize(index)}
                            className="text-gray-400 hover:text-red-500 text-sm"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-blue-50 p-3 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Maximum Blocks Per Cut
                </label>
                <input
                  type="number"
                  value={maxBlocksPerCut}
                  onChange={(e) => setMaxBlocksPerCut(parseInt(e.target.value) || 0)}
                  className="border border-gray-200 p-2 w-full rounded text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Max blocks that can be cut at once
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Maximum Stacking Cloth
                </label>
                <input
                  type="number"
                  value={maxStackingCloth}
                  onChange={(e) => setMaxStackingCloth(parseInt(e.target.value) || 0)}
                  className="border border-gray-200 p-2 w-full rounded text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Max cloth pieces that can be stacked
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={optimizeCutting}
                disabled={loading}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none disabled:bg-gray-300"
              >
                {loading ? 'Optimizing...' : 'Optimize Cutting Plan'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {result && (
              <div>
                <h1 className="text-xl font-semibold text-gray-800 mb-4">Optimization Results</h1>

                <div className="bg-blue-50 p-3 rounded-md mb-4">
                  <h2 className="text-md font-medium text-gray-700 mb-3">Summary</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <p className="text-xs text-gray-500">Total Orders</p>
                      <p className="text-lg font-bold text-gray-800">{result.totalOrderQuantity}</p>
                    </div>
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <p className="text-xs text-gray-500">Total Cuts</p>
                      <p className="text-lg font-bold text-gray-800">{result.totalCuts}</p>
                    </div>
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <p className="text-xs text-gray-500">Block Utilization</p>
                      <p className="text-lg font-bold text-green-600">{result.blockUtilizationPercent}%</p>
                    </div>
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <p className="text-xs text-gray-500">Stack Utilization</p>
                      <p className="text-lg font-bold text-green-600">{result.stackUtilizationPercent}%</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h2 className="text-md font-medium text-gray-700 mb-3">Size Summary</h2>
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                          <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuts</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-50">
                        {result.summary.map((size) => (
                          <tr key={size.size}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">{size.size}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">{size.quantity}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {size.cuts.map((cut, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    Cut #{cut.cutNumber}: {cut.blocks}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <h2 className="text-md font-medium text-gray-700 mb-3">Cutting Plan</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cut #</th>
                          <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stack</th>
                          <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blocks</th>
                          <th className="px-3 py-2 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-50">
                        {result.cuttingPlan.map((cut) => (
                          <tr key={cut.cutNumber}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">{cut.cutNumber}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">{cut.stackSize}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(cut.blocks).map(([size, count]) => (
                                  <span key={size} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    {size}: {count}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {cut.remainingAfterCut && Object.entries(cut.remainingAfterCut).map(([size, count]) => (
                                  <span key={size} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    {size}: {count}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setActiveTab('input')}
                    className="py-1.5 px-4 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    Back to Input
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="py-1.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none"
                  >
                    Print Results
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;