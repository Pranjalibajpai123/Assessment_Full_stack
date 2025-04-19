const WAREHOUSES = {
    C1: ['A', 'B', 'C'],
    C2: ['D', 'E', 'F'],
    C3: ['G', 'H', 'I']
};

const DISTANCES = {
    'C1-L1': 10,
    'L1-C1': 10,
    'C2-L1': 20,
    'L1-C2': 20,
    'C3-L1': 15,
    'L1-C3': 15,
    'C1-C2': 12,
    'C2-C1': 12,
    'C1-C3': 8,
    'C3-C1': 8,
    'C2-C3': 10,
    'C3-C2': 10
};

const PRODUCT_WEIGHT = 0.5; // kg
const COST_PER_KM_PER_KG = 2;

module.exports = {
    WAREHOUSES,
    DISTANCES,
    PRODUCT_WEIGHT,
    COST_PER_KM_PER_KG
}; 