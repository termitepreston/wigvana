import Category from "../models/Category.model.js";
import Product from "../models/Product.model.js"; // For listing products in category
import ApiError from "../errors/ApiError.js";
import httpStatusCodes from "http-status-codes";

/**
 * Constructs the base query for fetching active categories.
 * @returns {import('mongoose').FilterQuery<Category>} Mongoose query object.
 */
const getBaseCategoryQuery = () => {
  return { isActive: true };
};

/**
 * Lists all active categories with optional filtering and pagination.
 * @param {typeof import('../dtos/category.dto.js').listCategoriesQuerySchema._input.query} queryOptions - Options for filtering and pagination.
 * @returns {Promise<{results: Array<InstanceType<typeof Category>>, page: number, limit: number, totalPages: number, totalResults: number}>} Paginated categories.
 */
const listCategories = async (queryOptions) => {
  const { page, limit, name, slug, parentId } = queryOptions;
  const filter = getBaseCategoryQuery();

  if (name) {
    filter.name = { $regex: name, $options: "i" }; // Case-insensitive partial match
  }
  if (slug) {
    filter.slug = slug; // Exact match
  }
  if (parentId) {
    filter.parentId = parentId === "null" ? null : parentId;
  }

  const skip = (page - 1) * limit;

  const categories = await Category.find(filter)
    // .populate('parentId', 'name slug') // Optionally populate parent
    .sort({ displayOrder: 1, name: 1 }) // Sort by displayOrder, then name
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await Category.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: categories,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

/**
 * Gets details of a specific active category.
 * @param {string} categoryId - The ID of the category.
 * @returns {Promise<InstanceType<typeof Category> | null>} The category or null if not found.
 */
const getCategoryById = async (categoryId) => {
  const category = await Category.findOne({
    _id: categoryId,
    ...getBaseCategoryQuery(),
  })
    // .populate('parentId', 'name slug')
    // .populate({ // Example for populating subcategories if needed (can be heavy)
    //   path: 'subcategories',
    //   match: { isActive: true },
    //   select: 'name slug imageUrl'
    // })
    .lean();

  if (!category) {
    throw new ApiError(
      httpStatusCodes.NOT_FOUND,
      "Category not found or not active",
    );
  }
  return category;
};

/**
 * Lists published and approved products within a specific active category.
 * Uses product service's base query logic and adapts it.
 * @param {string} categoryId - The ID of the category.
 * @param {typeof import('../dtos/product.dto.js').listProductsQuerySchema._input.query} productQueryOptions - Options for filtering, sorting, and pagination of products.
 * @returns {Promise<{results: Array<InstanceType<typeof Product>>, page: number, limit: number, totalPages: number, totalResults: number}>} Paginated products.
 */
const listProductsInCategory = async (categoryId, productQueryOptions) => {
  // First, ensure the category exists and is active
  await getCategoryById(categoryId);

  const { search, sort_by, order, page, limit, minPrice, maxPrice, brand } =
    productQueryOptions;

  const productFilter = {
    categoryId, // Filter by the given category
    isPublished: true,
    approvalStatus: "approved",
  };

  if (search) {
    productFilter.$text = { $search: search };
  }
  if (brand) {
    productFilter.brand = { $regex: brand, $options: "i" };
  }
  if (typeof minPrice === "number") {
    productFilter.basePrice = { ...productFilter.basePrice, $gte: minPrice };
  }
  if (typeof maxPrice === "number") {
    productFilter.basePrice = { ...productFilter.basePrice, $lte: maxPrice };
  }

  const sortOptions = {};
  if (sort_by) {
    sortOptions[sort_by] = order === "asc" ? 1 : -1;
  } else {
    sortOptions.createdAt = -1;
  }

  const skip = (page - 1) * limit;

  const products = await Product.find(productFilter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await Product.countDocuments(productFilter);
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: products,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

/**
 * (Admin) Creates a new global category.
 * @param {typeof import('../dtos/admin.dto.js').adminCreateCategorySchema._input.body} categoryData - Data.
 * @returns {Promise<InstanceType<typeof Category>>} Created category.
 */
const adminCreateCategory = async (categoryData) => {
  if (categoryData.parentId) {
    const parentCategory = await Category.findById(categoryData.parentId);
    if (!parentCategory)
      throw new ApiError(
        httpStatusCodes.BAD_REQUEST,
        "Parent category not found.",
      );
  }
  if (!categoryData.slug && categoryData.name) {
    categoryData.slug = categoryData.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }
  if (await Category.exists({ slug: categoryData.slug })) {
    throw new ApiError(
      httpStatusCodes.CONFLICT,
      `Category slug '${categoryData.slug}' already exists.`,
    );
  }
  return Category.create(categoryData);
};

/**
 * (Admin) Updates a global category.
 * @param {string} categoryId - ID of the category.
 * @param {typeof import('../dtos/admin.dto.js').adminUpdateCategorySchema._input.body} updateData - Data.
 * @returns {Promise<InstanceType<typeof Category>>} Updated category.
 */
const adminUpdateCategory = async (categoryId, updateData) => {
  const category = await Category.findById(categoryId);
  if (!category)
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Category not found.");

  if (
    updateData.parentId &&
    updateData.parentId !== category.parentId?.toString()
  ) {
    if (updateData.parentId === categoryId)
      throw new ApiError(
        httpStatusCodes.BAD_REQUEST,
        "Category cannot be its own parent.",
      );
    const parentCategory = await Category.findById(updateData.parentId);
    if (!parentCategory)
      throw new ApiError(
        httpStatusCodes.BAD_REQUEST,
        "New parent category not found.",
      );
  }
  if (updateData.slug && updateData.slug !== category.slug) {
    if (
      await Category.exists({ slug: updateData.slug, _id: { $ne: categoryId } })
    ) {
      throw new ApiError(
        httpStatusCodes.CONFLICT,
        `Category slug '${updateData.slug}' already exists.`,
      );
    }
  }

  Object.assign(category, updateData);
  await category.save();
  // TODO: Invalidate category caches if any
  return category;
};

/**
 * (Admin) Deletes a global category.
 * @param {string} categoryId - ID of the category.
 * @returns {Promise<void>}
 */
const adminDeleteCategory = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category)
    throw new ApiError(httpStatusCodes.NOT_FOUND, "Category not found.");

  // Policy: Check if category is in use by products or has subcategories
  const productsInCategory = await Product.countDocuments({ categoryId });
  if (productsInCategory > 0) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "Cannot delete category: it is currently associated with products.",
    );
  }
  const subcategories = await Category.countDocuments({ parentId: categoryId });
  if (subcategories > 0) {
    throw new ApiError(
      httpStatusCodes.BAD_REQUEST,
      "Cannot delete category: it has subcategories. Delete them first.",
    );
  }

  await category.deleteOne();
  // TODO: Invalidate category caches
};

export const categoryService = {
  listCategories,
  getCategoryById,
  listProductsInCategory,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
};
