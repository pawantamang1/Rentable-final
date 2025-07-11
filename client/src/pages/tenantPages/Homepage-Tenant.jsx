// import { CircularProgress, Pagination } from "@mui/material";
// import { useCallback, useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { Footer, RealEstateCard, SearchAndFilter } from "../../components";
// import { getAllRealEstate } from "../../features/realEstateTenant/realEstateTenantSlice";

// const Homepage = () => {
//   const dispatch = useDispatch();

//   const { allRealEstate, isLoading, numberOfPages } = useSelector(
//     (store) => store.realEstateTenant
//   );

//   // initial query for search and filter
//   const initialQuery = {
//     page: 1,
//     search: "",
//     category: "all",
//     lowerLimit: "",
//     upperLimit: "",
//     priceFilter: "",
//   };

//   const [query, setQuery] = useState(initialQuery);

//   // get all real estate on page load and when page number changes
//   useEffect(() => {
//     dispatch(getAllRealEstate({ ...query }));
//   }, [query.page]);

//   // update price filter when lower and upper limit changes
//   useEffect(() => {
//     if (query.lowerLimit && query.upperLimit) {
//       query.priceFilter = query.lowerLimit + "-" + query.upperLimit;
//     }
//   }, [query.lowerLimit, query.upperLimit]);

//   // function to handle page number change
//   const handlePageChange = useCallback(
//     (event, value) => {
//       setQuery({ ...query, page: value });
//     },
//     [query]
//   );

//   // function to handle search and filter query value change
//   const handleValueChange = useCallback(
//     (event) => {
//       setQuery({ ...query, [event.target.name]: event.target.value });
//     },
//     [query]
//   );

//   // function to handle search and filter submission and reset page number to 1
//   const handleSearchSubmit = useCallback(
//     (event) => {
//       event.preventDefault();
//       dispatch(getAllRealEstate({ ...query, page: 1 }));
//     },
//     [query, dispatch]
//   );

//   // function to clear search and filter
//   const clearFilter = useCallback(() => {
//     setQuery(initialQuery);
//     dispatch(getAllRealEstate({ ...initialQuery }));
//   }, [dispatch]);

//   return (
//     <>
//       <div className="mt-8">
//         <SearchAndFilter
//           handleSearchSubmit={handleSearchSubmit}
//           handleValueChange={handleValueChange}
//           clearFilter={clearFilter}
//           {...query}
//         />

//         {isLoading ? (
//           <div className="flex justify-center mt-12 h-96">
//             <CircularProgress size={"8rem"} />
//           </div>
//         ) : (
//           <>
//             <h3 className="text-center mt-8 mb-6 font-heading font-bold">
//               All Properties
//             </h3>

//             {allRealEstate?.length === 0 ? (
//               <h2 className="text-center mt-8 mb-6 font-heading font-bold">
//                 No Real Estate Found
//               </h2>
//             ) : (
//               <main className="flex flex-wrap gap-5 justify-center mb-12 md:justify-center mx-4 md:mx-0">
//                 {allRealEstate?.map((item) => {
//                   return <RealEstateCard key={item._id} {...item} />;
//                 })}
//               </main>
//             )}
//           </>
//         )}
//       </div>

//       <Pagination
//         count={numberOfPages || 1}
//         page={query?.page}
//         onChange={handlePageChange}
//         color="secondary"
//         className="flex justify-center mb-12"
//       />
//       <Footer />
//     </>
//   );
// };

// export default Homepage;

import { CircularProgress, Pagination } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Footer, RealEstateCard, SearchAndFilter } from "../../components";
import {
  getAllRealEstate,
  getRecommendedProperties,
} from "../../features/realEstateTenant/realEstateTenantSlice";

const Homepage = () => {
  const dispatch = useDispatch();

  const {
    allRealEstate,
    isLoading,
    numberOfPages,
    recommendedProperties,
    recommendedIsLoading,
  } = useSelector((store) => store.realEstateTenant);

  // initial query for search and filter
  const initialQuery = {
    page: 1,
    search: "",
    category: "all",
    lowerLimit: "",
    upperLimit: "",
    priceFilter: "",
  };

  const [query, setQuery] = useState(initialQuery);

  // get all real estate on page load and when page number changes
  useEffect(() => {
    dispatch(getAllRealEstate({ ...query }));
  }, [query.page]);

  // update price filter when lower and upper limit changes
  useEffect(() => {
    if (query.lowerLimit && query.upperLimit) {
      query.priceFilter = query.lowerLimit + "-" + query.upperLimit;
    }
  }, [query.lowerLimit, query.upperLimit]);

  // function to handle search and filter submission and reset page number to 1
  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      dispatch(getAllRealEstate({ ...query, page: 1 }));
    },
    [query, dispatch]
  );

  // function to clear search and filter
  const clearFilter = useCallback(() => {
    setQuery(initialQuery);
    dispatch(getAllRealEstate({ ...initialQuery }));
  }, [dispatch]);

  // get all real estate and recommendations on page load
  useEffect(() => {
    dispatch(getRecommendedProperties({ limit: 4 }));
    dispatch(getAllRealEstate({ ...query }));
  }, []);

  // get all real estate when page number changes
  useEffect(() => {
    if (query.page !== 1) {
      dispatch(getAllRealEstate({ ...query }));
    }
  }, [query.page]);

  // update price filter when lower and upper limit changes
  useEffect(() => {
    if (query.lowerLimit && query.upperLimit) {
      query.priceFilter = query.lowerLimit + "-" + query.upperLimit;
    }
  }, [query.lowerLimit, query.upperLimit]);

  // function to handle page number change
  const handlePageChange = useCallback(
    (event, value) => {
      setQuery({ ...query, page: value });
    },
    [query]
  );

  // function to handle search and filter query value change
  const handleValueChange = useCallback(
    (event) => {
      setQuery({ ...query, [event.target.name]: event.target.value });
    },
    [query]
  );

  return (
    <>
      <div className="mt-8">
        <SearchAndFilter
          handleSearchSubmit={handleSearchSubmit}
          handleValueChange={handleValueChange}
          clearFilter={clearFilter}
          {...query}
        />

        {/* Recommended Properties Section */}
        <section className="mb-12">
          <h3 className="text-center mt-8 mb-6 font-heading font-bold">
            Recommended For You
          </h3>

          {recommendedIsLoading ? (
            <div className="flex justify-center">
              <CircularProgress size={"4rem"} />
            </div>
          ) : recommendedProperties?.length > 0 ? (
            <div className="flex flex-wrap gap-5 justify-center mx-4 md:mx-0">
              {recommendedProperties.map((item) => (
                <RealEstateCard key={item._id} {...item} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">
              Save some properties to get personalized recommendations
            </p>
          )}
        </section>

        {/* All Properties Section */}
        {isLoading ? (
          <div className="flex justify-center mt-12 h-96">
            <CircularProgress size={"8rem"} />
          </div>
        ) : (
          <>
            <h3 className="text-center mt-8 mb-6 font-heading font-bold">
              All Properties
            </h3>

            {allRealEstate?.length === 0 ? (
              <h2 className="text-center mt-8 mb-6 font-heading font-bold">
                No Properties Found
              </h2>
            ) : (
              <main className="flex flex-wrap gap-5 justify-center mb-12 md:justify-center mx-4 md:mx-0">
                {allRealEstate?.map((item) => {
                  return <RealEstateCard key={item._id} {...item} />;
                })}
              </main>
            )}
          </>
        )}
      </div>

      <Pagination
        count={numberOfPages || 1}
        page={query?.page}
        onChange={handlePageChange}
        color="secondary"
        className="flex justify-center mb-12"
      />
      <Footer />
    </>
  );
};

export default Homepage;
