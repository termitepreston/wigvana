import httpStatusCodes from "http-status-codes";
import { categoryService } from "../services/category.service.js";
import catchAsync from "../utils/catchAsync.js";
import pick from "../utils/pick.js";

/**
 * Controller to list all active categories.
 * @type {import('express').RequestHandler}
 */
const listCategories = catchAsync(async (req, res) => {
  const queryOptions = pick(req.query, [
    "page",
    "limit",
    "name",
    "slug",
    "parentId",
  ]);
  const result = await categoryService.listCategories(queryOptions);
  res.status(httpStatusCodes.OK).send(result);
});

/**
 * Controller to get details of a specific category.
 * @type {import('express').RequestHandler}
 */
const getCategoryDetails = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.categoryId);
  res.status(httpStatusCodes.OK).send(category);
});

/**
 * Controller to list products within a specific category.
 * @type {import('express').RequestHandler}
 */
const listProductsInCategory = catchAsync(async (req, res) => {
  const productQueryOptions = pick(req.query, [
    "search",
    "sort_by",
    "order",
    "page",
    "limit",
    "minPrice",
    "maxPrice",
    "brand",
  ]);
  const result = await categoryService.listProductsInCategory(
    req.params.categoryId,
    productQueryOptions,
  );
  res.status(httpStatusCodes.OK).send(result);
});

export const categoryController = {
  listCategories,
  getCategoryDetails,
  listProductsInCategory,
};
