let allCourses = [];

const fileInput = document.getElementById("fileInput");
const listContainer = document.getElementById("list");
const courseInfo = document.getElementById("course-info");

class Course {
    constructor(id, title, department, level, credits, instructor, semester, description) {
        this.id = id;
        this.title = title;
        this.department = department;
        this.level = level;
        this.credits = credits;
        this.instructor = instructor;
        this.semester = semester;
        this.description = description;
    }


    getDetails() {
        return `
            <h2>${this.id}</h2>
            <p><strong>Title:</strong> ${this.title}</p>
            <p><strong>Department:</strong> ${this.department}</p>
            <p><strong>Level:</strong> ${this.level}</p>
            <p><strong>Credits:</strong> ${this.credits}</p>
            <p><strong>Instructor:</strong> ${this.instructor || 'TBA'}</p>
            <p><strong>Semester:</strong> ${this.semester}</p>
            <p>${this.description}</p>
        `;
    }
}

fileInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (!isValidCourseList(data)) {
                listContainer.innerText = "Invalid file: JSON must be a list of courses";
                return;
            }

            allCourses = data.map(courseData => new Course(
                courseData.id,
                courseData.title,
                courseData.department,
                courseData.level,
                courseData.credits,
                courseData.instructor,
                courseData.semester,
                courseData.description
            ));

            displayData(allCourses);
            setupFilters(allCourses);
            setupSorting(allCourses);
        } catch (error) {
            listContainer.innerText = "Error parsing JSON: " + error.message;
        }
    };

    reader.onerror = function() {
        listContainer.innerText = "Error reading file.";
    };

    reader.readAsText(file);
});


function displayData(data) {
    listContainer.innerHTML = ""; // Clear the list

    data.forEach(course => {
        const courseDiv = document.createElement("div");
        courseDiv.className = "course-item";
        courseDiv.setAttribute("data-id", course.id);
        courseDiv.textContent = course.id;
        
        // Add click listener to each course
        courseDiv.addEventListener("click", function() {
            // Remove active class from all courses
            document.querySelectorAll(".course-item").forEach(item => {
                item.classList.remove("active");
            });
            
            // Add active class to clicked course
            this.classList.add("active");
            
            // Show course details
            showCourseDetails(course);
        });
        
        listContainer.appendChild(courseDiv);
    });
}

function showCourseDetails(course) {
    courseInfo.innerHTML = course.getDetails();
}

//this just checks the json file that it is a course json
function isValidCourseList(data) {
    if (!Array.isArray(data)) return false;
    if (data.length === 0) return false;

    for (const item of data) {
        if (typeof item !== "object" || item === null) return false;
        if (!("id" in item)) return false;
        if (typeof item.id !== "string") return false;
        if (!("title" in item) || !("department" in item)) return false;
    }

    return true;
}

// 4. Filtering Functionality (2 Points)
function setupFilters(courses) {
    const departmentFilter = document.getElementById("department");
    const levelFilter = document.getElementById("level");
    const creditsFilter = document.getElementById("credits");
    const instructorFilter = document.getElementById("instructor");

    const departments = [...new Set(courses.map(c => c.department))].sort();
    const levels = [...new Set(courses.map(c => c.level))].sort((a, b) => a - b);
    const credits = [...new Set(courses.map(c => c.credits))].sort((a, b) => a - b);
    const instructors = [...new Set(courses.map(c => c.instructor).filter(i => i !== null))].sort();

    // populates the dropdown with the values from json
    function populate(dropdown, values) {
        dropdown.innerHTML = "<option value='all'>All</option>";
        values.forEach(val => {
            const option = document.createElement('option');
            option.value = val;
            option.textContent = val;
            dropdown.appendChild(option);
        });
    }

    // populates each section
    populate(departmentFilter, departments);
    populate(levelFilter, levels);
    populate(creditsFilter, credits);
    populate(instructorFilter, instructors);

    // applies
    [departmentFilter, levelFilter, creditsFilter, instructorFilter].forEach(dropdown => {
        dropdown.addEventListener("change", applyFilters);
    });

    // so it actually filters
    function applyFilters() {
        const filters = {
            department: departmentFilter.value,
            level: levelFilter.value,
            credits: creditsFilter.value,
            instructor: instructorFilter.value
        };

        const filtered = allCourses.filter(course => {
          
            for (const [key, value] of Object.entries(filters)) {
                if (value === 'all') continue;
                
                const courseValue = course[key];
                const filterValue = (key === 'level' || key === 'credits') ? parseInt(value) : value;
                
                if (courseValue !== filterValue) return false;
            }
            
            return true;
        });

        displayData(filtered);
        
        // Clear course info if no courses match
        if (filtered.length === 0) {
            courseInfo.innerHTML = "<p>No courses match your filters.</p>";
        }
    }
}

// 5. Sorting Functionality (2 Points)
function setupSorting(courses) {
    const sortDropdown = document.getElementById("sort");
    
    const sortOptions = [
        { value: 'none', text: 'None' },
        { value: 'id-asc', text: 'ID (A–Z)' },
        { value: 'id-desc', text: 'ID (Z–A)' },
        { value: 'title-asc', text: 'Title (A–Z)' },
        { value: 'title-desc', text: 'Title (Z–A)' },
        { value: 'semester-earliest', text: 'Semester (Earliest first)' },
        { value: 'semester-latest', text: 'Semester (Latest first)' }
    ];

    sortOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        sortDropdown.appendChild(opt);
    });

    sortDropdown.addEventListener('change', function() {
        const sortValue = this.value;
        
        if (sortValue === 'none') {
            displayData(allCourses);
            return;
        }

        const [field, order] = sortValue.split('-');
        
        const sorted = [...allCourses].sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];

            if (field === 'semester') {
                const semesterOrder = { 'Winter': 1, 'Spring': 2, 'Fall': 3 };
                const parseYear = (sem) => parseInt(sem.split(' ')[1]);
                const parseSeason = (sem) => semesterOrder[sem.split(' ')[0]] || 0;
                
                const aYear = parseYear(aVal);
                const bYear = parseYear(bVal);
                const aSeason = parseSeason(aVal);
                const bSeason = parseSeason(bVal);
                
                if (aYear !== bYear) {
                    return order === 'earliest' ? aYear - bYear : bYear - aYear;
                }
                return order === 'earliest' ? aSeason - bSeason : bSeason - aSeason;
            }

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                const comparison = aVal.localeCompare(bVal);
                return order === 'asc' ? comparison : -comparison;
            }

            return 0;
        });

        displayData(sorted);
    });
}