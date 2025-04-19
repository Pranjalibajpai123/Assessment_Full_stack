// const { WAREHOUSES, DISTANCES, PRODUCT_WEIGHT, COST_PER_KM_PER_KG } = require('../utils/constants');

// class DeliveryService {
//     constructor() {
//         this.warehouseProducts = this._createWarehouseProductMap();
//     }

//     _createWarehouseProductMap() {
//         const map = {};
//         for (const [warehouse, products] of Object.entries(WAREHOUSES)) {
//             products.forEach(product => {
//                 map[product] = warehouse;
//             });
//         }
//         return map;
//     }

//     _getWarehouseForProduct(product) {
//         return this.warehouseProducts[product];
//     }

//     _calculateLegCost(distance, weight) {
//         return distance * weight * COST_PER_KM_PER_KG;
//     }

//     _getOptimalRoute(order) {
//         // Group products by warehouse
//         const warehouseGroups = {};
//         for (const [product, quantity] of Object.entries(order)) {
//             const warehouse = this._getWarehouseForProduct(product);
//             if (!warehouseGroups[warehouse]) {
//                 warehouseGroups[warehouse] = 0;
//             }
//             warehouseGroups[warehouse] += quantity;
//         }

//         // Calculate total weight for each warehouse
//         const warehouseWeights = {};
//         for (const [warehouse, quantity] of Object.entries(warehouseGroups)) {
//             warehouseWeights[warehouse] = quantity * PRODUCT_WEIGHT;
//         }

//         // If only one warehouse is needed, return direct route
//         const warehouses = Object.keys(warehouseGroups);
//         if (warehouses.length === 1) {
//             const warehouse = warehouses[0];
//             return {
//                 route: [`${warehouse}-L1`],
//                 cost: this._calculateLegCost(DISTANCES[`${warehouse}-L1`], warehouseWeights[warehouse])
//             };
//         }

//         // For multiple warehouses, find the optimal route
//         let minCost = Infinity;
//         let optimalRoute = [];

//         // Try each warehouse as starting point
//         for (const startWarehouse of warehouses) {
//             const remainingWarehouses = warehouses.filter(w => w !== startWarehouse);
//             const totalWeight = Object.values(warehouseWeights).reduce((a, b) => a + b, 0);

//             // Calculate cost for each possible route
//             for (const perm of this._getPermutations(remainingWarehouses)) {
//                 const route = [startWarehouse, ...perm, 'L1'];
//                 let cost = 0;
//                 let currentWeight = totalWeight;

//                 for (let i = 0; i < route.length - 1; i++) {
//                     const from = route[i];
//                     const to = route[i + 1];
//                     const legWeight = from === 'L1' ? 0 : warehouseWeights[from];
//                     cost += this._calculateLegCost(DISTANCES[`${from}-${to}`], currentWeight);
//                     currentWeight -= legWeight;
//                 }

//                 if (cost < minCost) {
//                     minCost = cost;
//                     optimalRoute = route;
//                 }
//             }
//         }

//         return {
//             route: optimalRoute.map((w, i) => i < optimalRoute.length - 1 ? `${w}-${optimalRoute[i + 1]}` : null).filter(Boolean),
//             cost: minCost
//         };
//     }

//     _getPermutations(arr) {
//         if (arr.length <= 1) return [arr];
//         const result = [];
//         for (let i = 0; i < arr.length; i++) {
//             const current = arr[i];
//             const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
//             const remainingPerms = this._getPermutations(remaining);
//             for (const perm of remainingPerms) {
//                 result.push([current, ...perm]);
//             }
//         }
//         return result;
//     }

//     calculateMinimumCost(order) {
//         const { cost } = this._getOptimalRoute(order);
//         return Math.round(cost);
//     }
// }

// module.exports = new DeliveryService(); 
const { WAREHOUSES, DISTANCES, PRODUCT_WEIGHT, COST_PER_KM_PER_KG } = require('../utils/constants');

class DeliveryService {
    constructor() {
        this.warehouseProducts = this._createWarehouseProductMap();
    }

    _createWarehouseProductMap() {
        const map = {};
        for (const [warehouse, products] of Object.entries(WAREHOUSES)) {
            products.forEach(product => {
                map[product] = warehouse;
            });
        }
        return map;
    }

    _getWarehouseForProduct(product) {
        return this.warehouseProducts[product];
    }

    _calculateLegCost(distance, weight) {
        return distance * weight * COST_PER_KM_PER_KG;
    }

    /**
     * Calculate the total weight of products in an order
     */
    _calculateTotalWeight(order) {
        return Object.values(order).reduce((sum, qty) => sum + qty, 0) * PRODUCT_WEIGHT;
    }

    /**
     * Group order products by warehouse
     */
    _groupByWarehouse(order) {
        const warehouseOrders = {};
        
        for (const [product, quantity] of Object.entries(order)) {
            const warehouse = this._getWarehouseForProduct(product);
            
            if (!warehouseOrders[warehouse]) {
                warehouseOrders[warehouse] = {};
            }
            
            warehouseOrders[warehouse][product] = quantity;
        }
        
        return warehouseOrders;
    }

    /**
     * Calculate warehouse weights
     */
    _calculateWarehouseWeights(warehouseOrders) {
        const weights = {};
        
        for (const [warehouse, products] of Object.entries(warehouseOrders)) {
            weights[warehouse] = this._calculateTotalWeight(products);
        }
        
        return weights;
    }

    /**
     * Get all possible permutations of an array
     */
    _getPermutations(arr) {
        if (arr.length <= 1) return [arr];
        
        const result = [];
        
        for (let i = 0; i < arr.length; i++) {
            const current = arr[i];
            const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const remainingPerms = this._getPermutations(remaining);
            
            for (const perm of remainingPerms) {
                result.push([current, ...perm]);
            }
        }
        
        return result;
    }

    /**
     * Generate all valid routes with or without intermediate L1 visits
     */
    _generateAllRoutes(warehouses) {
        const allRoutes = [];
        
        // For each permutation of warehouse order
        for (const warehousePerm of this._getPermutations(warehouses)) {
            // Generate routes with different L1 visit patterns
            this._generateRoutesWithL1(warehousePerm, [], allRoutes);
        }
        
        return allRoutes;
    }
    
    /**
     * Recursively generate all possible routes with L1 intermediate visits
     */
    _generateRoutesWithL1(remainingWarehouses, currentRoute, allRoutes) {
        // Base case: no more warehouses to visit
        if (remainingWarehouses.length === 0) {
            // Must end with L1
            if (currentRoute.length === 0 || currentRoute[currentRoute.length - 1] !== 'L1') {
                currentRoute.push('L1');
            }
            allRoutes.push([...currentRoute]);
            return;
        }
        
        const nextWarehouse = remainingWarehouses[0];
        const newRemaining = remainingWarehouses.slice(1);
        
        // Option 1: Visit next warehouse, then continue
        this._generateRoutesWithL1(
            newRemaining, 
            [...currentRoute, nextWarehouse], 
            allRoutes
        );
        
        // Option 2: Visit next warehouse, go to L1, then continue
        this._generateRoutesWithL1(
            newRemaining, 
            [...currentRoute, nextWarehouse, 'L1'], 
            allRoutes
        );
    }

    /**
     * Calculate cost for a given route
     */
    _calculateRouteCost(route, warehouseWeights) {
        let cost = 0;
        let remainingWeights = { ...warehouseWeights };
        let currentWeight = 0;
        
        // Convert route into leg segments
        const legs = [];
        for (let i = 0; i < route.length - 1; i++) {
            legs.push([route[i], route[i + 1]]);
        }
        
        for (const [from, to] of legs) {
            // Skip invalid legs
            if (from === to) continue;
            
            const distanceKey = `${from}-${to}`;
            if (!DISTANCES[distanceKey]) {
                console.error(`Missing distance for ${distanceKey}`);
                return { cost: Infinity, route: [] };
            }
            
            // Calculate current cargo weight
            if (from !== 'L1') {
                // Picking up from warehouse
                if (remainingWeights[from]) {
                    currentWeight += remainingWeights[from];
                    delete remainingWeights[from];
                }
            }
            
            // Calculate cost for this leg
            cost += this._calculateLegCost(DISTANCES[distanceKey], currentWeight);
            
            // If arriving at L1, delivery is made and cargo weight becomes 0
            if (to === 'L1') {
                currentWeight = 0;
            }
        }
        
        return { cost, route: legs.map(([from, to]) => `${from}-${to}`) };
    }

    /**
     * Main function to calculate optimal route and minimum cost
     */
    _getOptimalRoute(order) {
        // Group order by warehouse
        const warehouseOrders = this._groupByWarehouse(order);
        const warehouses = Object.keys(warehouseOrders);
        
        // If only one warehouse, direct route
        if (warehouses.length === 1) {
            const warehouse = warehouses[0];
            const weight = this._calculateTotalWeight(warehouseOrders[warehouse]);
            const distance = DISTANCES[`${warehouse}-L1`];
            const cost = this._calculateLegCost(distance, weight);
            
            return {
                route: [`${warehouse}-L1`],
                cost: cost
            };
        }
        
        // Calculate weights for each warehouse
        const warehouseWeights = this._calculateWarehouseWeights(warehouseOrders);
        
        // Generate all possible routes and find minimum cost
        let minCost = Infinity;
        let bestRoute = [];
        
        // Loop through each possible starting warehouse
        for (const startWarehouse of warehouses) {
            const otherWarehouses = warehouses.filter(w => w !== startWarehouse);
            
            // Generate routes starting from this warehouse
            const possibleRoutes = [[startWarehouse]];
            this._generateRoutesWithL1([...otherWarehouses], [startWarehouse], possibleRoutes);
            
            // Calculate cost for each route
            for (const route of possibleRoutes) {
                // Make sure route ends at L1
                const finalRoute = route[route.length - 1] === 'L1' ? route : [...route, 'L1'];
                const { cost, route: segments } = this._calculateRouteCost(finalRoute, warehouseWeights);
                
                if (cost < minCost) {
                    minCost = cost;
                    bestRoute = segments;
                }
            }
        }
        
        return {
            route: bestRoute,
            cost: minCost
        };
    }

    /**
     * Public method to calculate minimum cost
     */
    calculateMinimumCost(order) {
        const { cost } = this._getOptimalRoute(order);
        return Math.round(cost);
    }
}

module.exports = new DeliveryService();